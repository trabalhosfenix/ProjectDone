import { Prisma, PrismaClient } from "@prisma/client";

type GlobalPrisma = {
  prisma?: PrismaClient;
  projectEnumMiddlewareRegistered?: boolean;
};

const globalForPrisma = global as unknown as GlobalPrisma;

const PROJECT_STATUS_VALUES = ["A_INICIAR", "EM_ANDAMENTO", "CONCLUIDO", "PARADO"] as const;
const PRIORITY_VALUES = ["BAIXA", "MEDIA", "ALTA"] as const;
const SYNC_STATUS_VALUES = ["IDLE", "SYNCING", "SYNCED", "ERROR"] as const;

function normalizeEnumInput(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function toProjectStatus(value: string) {
  const raw = value.trim().toUpperCase();
  if ((PROJECT_STATUS_VALUES as readonly string[]).includes(raw)) return raw;

  const normalized = normalizeEnumInput(value);
  if (["a iniciar", "ainiciar", "nao iniciado", "em planejamento", "planejamento"].includes(normalized)) {
    return "A_INICIAR";
  }
  if (["andamento", "em andamento", "em execucao", "execucao", "in progress", "progress"].includes(normalized)) {
    return "EM_ANDAMENTO";
  }
  if (["concluido", "done", "completed", "finalizado"].includes(normalized)) {
    return "CONCLUIDO";
  }
  if (["parado", "pausado", "cancelado", "cancelada", "atraso", "em atraso", "atrasado"].includes(normalized)) {
    return "PARADO";
  }
  return "A_INICIAR";
}

function toPriorityLevel(value: string) {
  const raw = value.trim().toUpperCase();
  if ((PRIORITY_VALUES as readonly string[]).includes(raw)) return raw;

  const normalized = normalizeEnumInput(value);
  if (["baixa", "low"].includes(normalized)) return "BAIXA";
  if (["alta", "high", "critica", "critical", "urgente"].includes(normalized)) return "ALTA";
  return "MEDIA";
}

function toSyncStatus(value: string) {
  const raw = value.trim().toUpperCase();
  if ((SYNC_STATUS_VALUES as readonly string[]).includes(raw)) return raw;

  const normalized = normalizeEnumInput(value);
  if (["syncing", "sincronizando", "sincronizacao em andamento", "in progress"].includes(normalized)) {
    return "SYNCING";
  }
  if (["synced", "sincronizado", "concluido", "completed", "success", "sucesso"].includes(normalized)) {
    return "SYNCED";
  }
  if (["error", "erro", "failed", "falha"].includes(normalized)) {
    return "ERROR";
  }
  return "IDLE";
}

function normalizeFieldValue(value: unknown, parser: (input: string) => string): unknown {
  if (typeof value === "string") {
    return parser(value);
  }

  if (
    value &&
    typeof value === "object" &&
    "set" in (value as Record<string, unknown>) &&
    typeof (value as { set?: unknown }).set === "string"
  ) {
    return { ...(value as Record<string, unknown>), set: parser((value as { set: string }).set) };
  }

  return value;
}

function normalizeProjectData(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;

  const record = { ...(data as Record<string, unknown>) };
  if ("status" in record) {
    record.status = normalizeFieldValue(record.status, toProjectStatus);
  }
  if ("priority" in record) {
    record.priority = normalizeFieldValue(record.priority, toPriorityLevel);
  }
  return record;
}

function normalizeProjectDataBatch(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map((entry) => normalizeProjectData(entry));
  }
  return normalizeProjectData(data);
}

function normalizeImportedProjectData(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;

  const record = { ...(data as Record<string, unknown>) };
  if ("syncStatus" in record) {
    record.syncStatus = normalizeFieldValue(record.syncStatus, toSyncStatus);
  }
  return record;
}

function normalizeImportedProjectDataBatch(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map((entry) => normalizeImportedProjectData(entry));
  }
  return normalizeImportedProjectData(data);
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (!globalForPrisma.projectEnumMiddlewareRegistered) {
  prisma.$use(async (params: Prisma.MiddlewareParams, next) => {
    if (params.model === "Project") {
      if (params.action === "create" || params.action === "update") {
        if (params.args?.data) {
          params.args.data = normalizeProjectData(params.args.data);
        }
      } else if (params.action === "upsert") {
        if (params.args?.create) {
          params.args.create = normalizeProjectData(params.args.create);
        }
        if (params.args?.update) {
          params.args.update = normalizeProjectData(params.args.update);
        }
      } else if (params.action === "createMany" || params.action === "updateMany") {
        if (params.args?.data) {
          params.args.data = normalizeProjectDataBatch(params.args.data);
        }
      }
    } else if (params.model === "ImportedProject") {
      if (params.action === "create" || params.action === "update") {
        if (params.args?.data) {
          params.args.data = normalizeImportedProjectData(params.args.data);
        }
      } else if (params.action === "upsert") {
        if (params.args?.create) {
          params.args.create = normalizeImportedProjectData(params.args.create);
        }
        if (params.args?.update) {
          params.args.update = normalizeImportedProjectData(params.args.update);
        }
      } else if (params.action === "createMany" || params.action === "updateMany") {
        if (params.args?.data) {
          params.args.data = normalizeImportedProjectDataBatch(params.args.data);
        }
      }
    }

    return next(params);
  });
  globalForPrisma.projectEnumMiddlewareRegistered = true;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
