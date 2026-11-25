import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { instanceUserRoles, type Db } from "@paperclipai/db";
import { resolvePaperclipInstanceRoot } from "../home-paths.js";
import { logger } from "../middleware/logger.js";
import type { StorageService } from "../storage/types.js";
import { companyPortabilityService } from "./company-portability.js";

/**
 * Starter company: when PAPERCLIP_STARTER_COMPANY_DIR points at an agentcompanies/v1 package,
 * the first instance admin gets that company (agents, instructions, skills) imported once,
 * so a fresh Docker image is usable after adding AI accounts.
 */

const MARKER_FILE = "starter-company.json";

export function starterCompanyDir(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.PAPERCLIP_STARTER_COMPANY_DIR?.trim() || null;
}

/** Every file of the package as UTF-8 text, keyed by its POSIX path relative to the package root. */
export async function readStarterPackage(root: string, current = root, files: Record<string, string> = {}) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    if (entry.name.startsWith(".git") || entry.name === "__pycache__") continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) await readStarterPackage(root, absolute, files);
    else if (entry.isFile()) files[path.relative(root, absolute).split(path.sep).join("/")] = await readFile(absolute, "utf8");
  }
  return files;
}

export async function firstInstanceAdminId(db: Db): Promise<string | null> {
  const row = await db
    .select({ userId: instanceUserRoles.userId })
    .from(instanceUserRoles)
    .where(eq(instanceUserRoles.role, "instance_admin"))
    .orderBy(asc(instanceUserRoles.createdAt))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  return row?.userId ?? null;
}

let running: Promise<unknown> | null = null;

/**
 * Import the starter company for `userId` unless it was already done for this instance.
 * Never throws: a failed import is logged and retried on the next boot.
 */
export async function ensureStarterCompany(
  db: Db,
  storage: StorageService | undefined,
  opts: { userId: string; packageDir?: string | null; instanceRoot?: string },
): Promise<"imported" | "skipped" | "failed"> {
  const packageDir = opts.packageDir === undefined ? starterCompanyDir() : opts.packageDir;
  if (!packageDir) return "skipped";
  const marker = path.join(opts.instanceRoot ?? resolvePaperclipInstanceRoot(), MARKER_FILE);
  // The claim route and the boot step can race; let the first caller finish.
  while (running) await running.catch(() => {});
  if (existsSync(marker)) return "skipped";
  const work = (async () => {
    const files = await readStarterPackage(packageDir);
    const result = await companyPortabilityService(db, storage).importBundle(
      {
        source: { type: "inline", rootPath: path.basename(packageDir), files },
        include: { company: true, agents: true, skills: true, projects: false, issues: false },
        target: { mode: "new_company" },
        agents: "all",
        collisionStrategy: "rename",
      },
      opts.userId,
    );
    await mkdir(path.dirname(marker), { recursive: true });
    await writeFile(marker, JSON.stringify({ companyId: result.company.id, importedAt: new Date().toISOString() }, null, 2));
    logger.info({ companyId: result.company.id, packageDir }, "starter company imported");
  })();
  running = work;
  try {
    await work;
    return "imported";
  } catch (error) {
    logger.warn({ err: error, packageDir }, "starter company import failed; will retry on next boot");
    return "failed";
  } finally {
    running = null;
  }
}
