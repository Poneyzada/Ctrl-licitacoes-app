-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OPERADOR', 'COORDENADOR', 'DIRETOR', 'MANUTENCAO_MASTER', 'DIRETORIA', 'OPERADOR_CAMPO', 'OPERADOR_ADM');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('PROPRIA', 'PARCEIRA', 'CONSORCIO');

-- CreateEnum
CREATE TYPE "LicitacaoStatus" AS ENUM ('PROSPECCAO', 'EM_ANALISE', 'APROVADA', 'ATENCAO', 'EM_DIA', 'EM_DISPUTA', 'ACOMPANHANDO_RESULTADO', 'FINALIZADA', 'ENCERRADA', 'DESCARTADA', 'PERDIDA');

-- CreateEnum
CREATE TYPE "LicitacaoModalidade" AS ENUM ('CONCORRENCIA_ELETRONICA', 'LICITACAO_PRESENCIAL', 'CHAMAMENTO', 'PREGAO_ELETRONICO', 'DISPENSA');

-- CreateEnum
CREATE TYPE "TipoServico" AS ENUM ('ELABORACAO_PROJETOS', 'PROJETO_INFRAESTRUTURA', 'CONTRATACAO_INTEGRADA', 'EXECUCAO', 'EXECUCAO_INFRAESTRUTURA', 'SERVICOS_HIDRICOS', 'FISCALIZACAO', 'ASSESSORAMENTO', 'GERENCIAMENTO', 'MANUTENCAO', 'SUPERVISAO');

-- CreateEnum
CREATE TYPE "LicitacaoFase" AS ENUM ('CAPTACAO', 'TRIAGEM', 'HABILITACAO', 'PROPOSTA_TECNICA', 'PROPOSTA_COMERCIAL', 'DISPUTA', 'RECURSO', 'ADJUDICACAO', 'HOMOLOGACAO', 'CONTRATACAO', 'ENCERRAMENTO');

-- CreateEnum
CREATE TYPE "DocumentoStatus" AS ENUM ('AGUARDANDO', 'PROCESSANDO', 'EXTRAIDO', 'REQUER_OCR', 'ANALISADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "DocumentoCategoria" AS ENUM ('EDITAL', 'RETIFICACAO', 'ESCLARECIMENTO', 'IMPUGNACAO_DECISAO', 'SUSPENSAO', 'SINE_DIE', 'REABERTURA', 'CONSOLIDACAO', 'ATA_RESULTADO', 'HABILITACAO', 'PROPOSTA_TECNICA', 'PROPOSTA_COMERCIAL', 'ADVERSARIO', 'DILIGENCIA_RECURSO', 'CONTRATO', 'OUTROS');

-- CreateEnum
CREATE TYPE "RiscoGravidade" AS ENUM ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "RecursoTipo" AS ENUM ('IMPUGNACAO', 'ESCLARECIMENTO', 'INTENCAO_RECURSAL', 'RECURSO', 'CONTRARRAZOES', 'DILIGENCIA', 'JULGAMENTO');

-- CreateEnum
CREATE TYPE "NotificacaoCategoria" AS ENUM ('URGENTE', 'PRAZO', 'DOCUMENTO', 'GERAL');

-- CreateEnum
CREATE TYPE "EventoTipo" AS ENUM ('SESSAO_PUBLICA', 'IMPUGNACAO', 'ESCLARECIMENTO', 'VISITA', 'ENTREGA', 'DILIGENCIA', 'RECURSO', 'CONTRARRAZOES', 'DECISAO', 'CERTIDAO', 'DOCUMENTO', 'PLATAFORMA', 'MUDANCA_EDITAL', 'POS_JULGAMENTO');

-- CreateEnum
CREATE TYPE "FollowupFase" AS ENUM ('PENDENTE', 'EM_ELABORACAO', 'PROTOCOLADO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "VinculoProfissional" AS ENUM ('CLT', 'PJ', 'AUTONOMO', 'SOCIO', 'PARCEIRO');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ATIVO', 'CONCLUIDO', 'SUSPENSO', 'RESCINDIDO');

-- CreateEnum
CREATE TYPE "ContractScope" AS ENUM ('OBRA', 'SERVICO', 'GERENCIAMENTO');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('TRIAGEM', 'APROVADO', 'RECUSADO', 'IMPUGNADO');

-- CreateEnum
CREATE TYPE "MeasurementStatus" AS ENUM ('EM_ANALISE', 'APROVADO', 'FATURADO', 'PAGO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "organ" TEXT NOT NULL,
    "scope" "ContractScope" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ATIVO',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "baseDate" TIMESTAMP(3) NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "physicalProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "address" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "editalUrl" TEXT,
    "aiReport" TEXT,
    "status" "TenderStatus" NOT NULL DEFAULT 'TRIAGEM',
    "decisionBy" TEXT,
    "decisionAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "completionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDENTE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "weather" TEXT NOT NULL,
    "progressPct" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "workforce" INTEGER,
    "lockedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "status" "MeasurementStatus" NOT NULL DEFAULT 'EM_ANALISE',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "nfNumber" TEXT,
    "nfUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guarantees" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "alertDaysBefore" INTEGER NOT NULL DEFAULT 30,
    "renewedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guarantees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIA',
    "status" "TaskStatus" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "contractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "type" "OrgType" NOT NULL DEFAULT 'PROPRIA',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consorcios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tcccUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consorcios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consorcio_membros" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL,
    "isLider" BOOLEAN NOT NULL DEFAULT false,
    "responsabilidade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consorcio_membros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licitacoes" (
    "id" TEXT NOT NULL,
    "orgaoNome" TEXT NOT NULL,
    "orgaoUasg" TEXT,
    "orgaoUnidade" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "modalidade" "LicitacaoModalidade",
    "numero" TEXT,
    "numeroProcesso" TEXT,
    "pncpId" TEXT,
    "objeto" TEXT NOT NULL,
    "objetoResumo" TEXT,
    "tipoServico" "TipoServico",
    "fase" "LicitacaoFase" NOT NULL DEFAULT 'CAPTACAO',
    "status" "LicitacaoStatus" NOT NULL DEFAULT 'PROSPECCAO',
    "risco" "RiscoGravidade",
    "plataforma" TEXT,
    "plataformaUrl" TEXT,
    "dataHoraSessao" TIMESTAMP(3),
    "dataEsclarecimento" TIMESTAMP(3),
    "dataImpugnacao" TIMESTAMP(3),
    "valorEstimado" DOUBLE PRECISION,
    "orcamentoSigiloso" BOOLEAN NOT NULL DEFAULT false,
    "permiteConsorcio" BOOLEAN NOT NULL DEFAULT false,
    "permiteSubcontrato" BOOLEAN NOT NULL DEFAULT false,
    "exigeVisita" BOOLEAN NOT NULL DEFAULT false,
    "exigeGarantia" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,
    "consorcioId" TEXT,
    "responsavelId" TEXT,
    "fonteOrigem" TEXT,
    "pncpUrl" TEXT,
    "observacoes" TEXT,
    "resultado" TEXT,
    "vencedor" TEXT,
    "valorFinal" DOUBLE PRECISION,
    "dataResultado" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licitacao_documentos" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "categoria" "DocumentoCategoria" NOT NULL DEFAULT 'OUTROS',
    "nome" TEXT NOT NULL,
    "mimeType" TEXT,
    "tamanhoBytes" INTEGER,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "status" "DocumentoStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "textoExtraido" TEXT,
    "ocrUsado" BOOLEAN NOT NULL DEFAULT false,
    "ocrQualidade" TEXT,
    "adversario" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licitacao_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edital_versions" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "tipoEvento" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "publicadoEm" TIMESTAMP(3),
    "vigencia" TIMESTAMP(3),
    "descricao" TEXT,
    "efeito" TEXT,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edital_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_edital" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_CONFERENCIA',
    "resumoExecutivo" TEXT,
    "riscos" TEXT,
    "lacunas" TEXT,
    "conflitos" TEXT,
    "proximosPassos" TEXT,
    "modelVersion" TEXT,
    "createdBy" TEXT,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analises_edital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitos" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fonte" TEXT,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "validade" TEXT,
    "responsavel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NAO_ANALISADO',
    "providencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipe_licitacao" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "funcaoProposta" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipe_licitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT,
    "vinculo" "VinculoProfissional" NOT NULL DEFAULT 'CLT',
    "conselho" TEXT,
    "numeroConselho" TEXT,
    "situacaoConselho" TEXT,
    "formacao" TEXT,
    "grau" TEXT,
    "instituicao" TEXT,
    "anoConclusao" INTEGER,
    "especializacoes" TEXT,
    "areasExperiencia" TEXT,
    "resumoProfissional" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acervo_tecnico" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "numeroAtestado" TEXT,
    "numeroCat" TEXT,
    "numeroContrato" TEXT,
    "emitente" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "tipoServico" TEXT,
    "servicosPrincipais" TEXT,
    "caracteristicas" TEXT,
    "quantitativos" TEXT,
    "areaTecnica" TEXT,
    "local" TEXT,
    "uf" TEXT,
    "periodoInicio" TIMESTAMP(3),
    "periodoFim" TIMESTAMP(3),
    "responsavelTecnico" TEXT,
    "palavrasChave" TEXT,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "urlOrigem" TEXT,
    "sincronizadoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acervo_tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acervo_matches" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "acervoId" TEXT NOT NULL,
    "requisito" TEXT,
    "compatibilidade" TEXT,
    "justificativa" TEXT,
    "analisadoPor" TEXT,
    "analisadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acervo_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_documents" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "professionalId" TEXT,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "emissor" TEXT,
    "emissao" TIMESTAMP(3),
    "vencimento" TIMESTAMP(3),
    "semVencimento" BOOLEAN NOT NULL DEFAULT false,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "compliance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_registrations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "codigo" TEXT,
    "email" TEXT,
    "responsavel" TEXT,
    "validade" TIMESTAMP(3),
    "observacoes" TEXT,
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurso_casos" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "tipo" "RecursoTipo" NOT NULL,
    "posicao" TEXT,
    "prazo" TIMESTAMP(3),
    "responsavel" TEXT,
    "concorrente" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "resumo" TEXT,
    "fundamento" TEXT,
    "proximaAcao" TEXT,
    "setor" TEXT,
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurso_casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_followups" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "fase" "FollowupFase" NOT NULL DEFAULT 'PENDENTE',
    "tipo" TEXT,
    "proximaAcao" TEXT,
    "prazo" TIMESTAMP(3),
    "responsavel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tender_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pncp_oportunidades" (
    "id" TEXT NOT NULL,
    "numeroControle" TEXT,
    "modalidade" TEXT,
    "objeto" TEXT NOT NULL,
    "orgao" TEXT,
    "municipio" TEXT,
    "uf" TEXT,
    "dataHoraSessao" TIMESTAMP(3),
    "valorEstimado" DOUBLE PRECISION,
    "pncpUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOVA',
    "recomendacao" TEXT,
    "justificativa" TEXT,
    "captadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisaoBy" TEXT,
    "decisaoAt" TIMESTAMP(3),
    "licitacaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pncp_oportunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "EventoTipo" NOT NULL,
    "licitacaoId" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "responsavel" TEXT,
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "localizacao" TEXT,
    "descricao" TEXT,
    "visibilidade" TEXT NOT NULL DEFAULT 'TODOS',
    "lembretes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "icsKey" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoria" "NotificacaoCategoria" NOT NULL DEFAULT 'GERAL',
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "licitacaoId" TEXT,
    "entidadeTipo" TEXT,
    "entidadeId" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "lidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delete_authorizations" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "authorizadoPor" TEXT NOT NULL,
    "usadoPor" TEXT,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delete_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_number_key" ON "contracts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "contract_assignments_userId_contractId_key" ON "contract_assignments"("userId", "contractId");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_contractId_key" ON "tenders"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_measurementId_key" ON "invoices"("measurementId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_key" ON "organizations"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "equipe_licitacao_licitacaoId_professionalId_key" ON "equipe_licitacao"("licitacaoId", "professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "pncp_oportunidades_numeroControle_key" ON "pncp_oportunidades"("numeroControle");

-- CreateIndex
CREATE UNIQUE INDEX "delete_authorizations_codigo_key" ON "delete_authorizations"("codigo");

-- AddForeignKey
ALTER TABLE "contract_assignments" ADD CONSTRAINT "contract_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_assignments" ADD CONSTRAINT "contract_assignments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_decisionBy_fkey" FOREIGN KEY ("decisionBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "measurements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantees" ADD CONSTRAINT "guarantees_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consorcio_membros" ADD CONSTRAINT "consorcio_membros_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consorcio_membros" ADD CONSTRAINT "consorcio_membros_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacao_documentos" ADD CONSTRAINT "licitacao_documentos_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacao_documentos" ADD CONSTRAINT "licitacao_documentos_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edital_versions" ADD CONSTRAINT "edital_versions_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edital_versions" ADD CONSTRAINT "edital_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_edital" ADD CONSTRAINT "analises_edital_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_edital" ADD CONSTRAINT "analises_edital_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_edital" ADD CONSTRAINT "analises_edital_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos" ADD CONSTRAINT "requisitos_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipe_licitacao" ADD CONSTRAINT "equipe_licitacao_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipe_licitacao" ADD CONSTRAINT "equipe_licitacao_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "profissionais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais" ADD CONSTRAINT "profissionais_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acervo_tecnico" ADD CONSTRAINT "acervo_tecnico_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acervo_matches" ADD CONSTRAINT "acervo_matches_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acervo_matches" ADD CONSTRAINT "acervo_matches_acervoId_fkey" FOREIGN KEY ("acervoId") REFERENCES "acervo_tecnico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_registrations" ADD CONSTRAINT "platform_registrations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso_casos" ADD CONSTRAINT "recurso_casos_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_followups" ADD CONSTRAINT "tender_followups_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
