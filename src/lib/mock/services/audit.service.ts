import type { AuditLog, AuditQuery, Paginated } from "@/types";
import type { AuditService } from "../../api/contracts";
import { mockRequest } from "../../api/delay";
import { matchesSearch, paginate, sortByKey } from "../../api/pagination";
import { getDb } from "../db";

function accessors(log: AuditLog) {
  return {
    actor: log.actorName,
    action: log.action,
    entity: log.entityLabel,
    organization: log.organizationName ?? "",
    status: log.status,
    createdAt: log.createdAt,
  };
}

export const auditService: AuditService = {
  async list(query: AuditQuery = {}): Promise<Paginated<AuditLog>> {
    return mockRequest("loading audit activity", () => {
      const db = getDb();
      const rows = db.auditLogs.filter((log) => {
        if (query.action && query.action !== "ALL" && log.action !== query.action) return false;
        if (
          query.organizationId &&
          query.organizationId !== "ALL" &&
          log.organizationId !== query.organizationId
        ) {
          return false;
        }
        if (query.entityType && query.entityType !== "ALL" && log.entityType !== query.entityType) {
          return false;
        }
        return matchesSearch(
          [log.actorName, log.action, log.entityLabel, log.organizationName, log.correlationId],
          query.search,
        );
      });
      const sorted = sortByKey(
        rows,
        query.sortBy ?? "createdAt",
        query.sortDir ?? "desc",
        accessors,
      );
      return paginate(sorted, query);
    });
  },
};
