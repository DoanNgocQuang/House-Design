import { agents, assets, issueAttachments, issues, type Db } from "@paperclipai/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { issueReadSqlCondition, type AuthorizationActor } from "./authorization.js";

export type ProjectFile = {
  attachmentId: string;
  filename: string;
  contentType: string;
  createdByAgent: string | null;
  byteSize: number;
  createdAt: string;
  issue: { id: string; identifier: string | null; title: string; status: string };
};

/** Newest upload of each file name first; a reworked file replaces its older copies. */
export function latestPerFilename<T extends { filename: string; createdAt: string }>(rows: T[]): T[] {
  const newest = new Map<string, T>();
  for (const row of rows) {
    const current = newest.get(row.filename);
    if (!current || row.createdAt > current.createdAt) newest.set(row.filename, row);
  }
  return [...newest.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Every file attached to the project's tasks the actor may read (latest upload per file name). */
export async function listProjectFiles(db: Db, actor: AuthorizationActor, companyId: string, projectId: string): Promise<ProjectFile[]> {
  const readable = await issueReadSqlCondition(db, actor);
  const rows = await db
    .select({
      attachmentId: issueAttachments.id,
      filename: assets.originalFilename,
      contentType: assets.contentType,
      byteSize: assets.byteSize,
      createdAt: issueAttachments.createdAt,
      createdByAgent: agents.name,
      issueId: issues.id,
      identifier: issues.identifier,
      title: issues.title,
      status: issues.status,
    })
    .from(issueAttachments)
    .innerJoin(assets, eq(issueAttachments.assetId, assets.id))
    .innerJoin(issues, eq(issueAttachments.issueId, issues.id))
    .leftJoin(agents, eq(assets.createdByAgentId, agents.id))
    .where(and(
      eq(issueAttachments.companyId, companyId),
      eq(issues.companyId, companyId),
      isNull(issues.hiddenAt),
      readable,
      eq(issues.projectId, projectId),
    ))
    .orderBy(desc(issueAttachments.createdAt))
    .limit(1000);
  return latestPerFilename(rows.map((row) => ({
    attachmentId: row.attachmentId,
    filename: row.filename ?? "file",
    contentType: row.contentType,
    byteSize: Number(row.byteSize),
    createdAt: row.createdAt.toISOString(),
    createdByAgent: row.createdByAgent ?? null,
    issue: { id: row.issueId, identifier: row.identifier, title: row.title, status: row.status },
  })));
}
