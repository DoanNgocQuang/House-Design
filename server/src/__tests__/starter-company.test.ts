import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@paperclipai/db";

const { importBundle } = vi.hoisted(() => ({ importBundle: vi.fn() }));
vi.mock("../services/company-portability.js", () => ({ companyPortabilityService: () => ({ importBundle }) }));

const { ensureStarterCompany, readStarterPackage } = await import("../services/starter-company.js");

async function makePackage() {
  const root = await mkdtemp(path.join(tmpdir(), "starter-pkg-"));
  await mkdir(path.join(root, "agents", "ceo"), { recursive: true });
  await mkdir(path.join(root, "skills", "house-builder", "scripts"), { recursive: true });
  await mkdir(path.join(root, ".git"), { recursive: true });
  await writeFile(path.join(root, "COMPANY.md"), "---\nname: Studio\n---\n");
  await writeFile(path.join(root, ".paperclip.yaml"), "schema: paperclip/v1\n");
  await writeFile(path.join(root, "agents", "ceo", "AGENTS.md"), "CEO");
  await writeFile(path.join(root, "skills", "house-builder", "scripts", "house_builder.py"), "print(1)\n");
  await writeFile(path.join(root, ".git", "HEAD"), "ref");
  return root;
}

beforeEach(() => importBundle.mockReset().mockResolvedValue({ company: { id: "company-1" } }));

describe("readStarterPackage", () => {
  it("reads every package file as text with POSIX paths and skips .git", async () => {
    const files = await readStarterPackage(await makePackage());
    expect(Object.keys(files).sort()).toEqual([
      ".paperclip.yaml", "COMPANY.md", "agents/ceo/AGENTS.md", "skills/house-builder/scripts/house_builder.py",
    ]);
    expect(files["skills/house-builder/scripts/house_builder.py"]).toBe("print(1)\n");
  });
});

describe("ensureStarterCompany", () => {
  it("imports once for the admin as owner, then skips thanks to the marker", async () => {
    const packageDir = await makePackage();
    const instanceRoot = await mkdtemp(path.join(tmpdir(), "starter-home-"));
    const db = {} as Db;

    expect(await ensureStarterCompany(db, undefined, { userId: "admin-1", packageDir, instanceRoot })).toBe("imported");
    expect(importBundle).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ type: "inline", files: expect.objectContaining({ "COMPANY.md": expect.any(String) }) }),
        target: { mode: "new_company" },
        include: expect.objectContaining({ company: true, agents: true, skills: true, projects: false, issues: false }),
      }),
      "admin-1",
    );
    expect(JSON.parse(await readFile(path.join(instanceRoot, "starter-company.json"), "utf8")).companyId).toBe("company-1");

    expect(await ensureStarterCompany(db, undefined, { userId: "admin-1", packageDir, instanceRoot })).toBe("skipped");
    expect(importBundle).toHaveBeenCalledTimes(1);
  });

  it("does nothing without a package dir and never throws when the import fails", async () => {
    const instanceRoot = await mkdtemp(path.join(tmpdir(), "starter-home-"));
    expect(await ensureStarterCompany({} as Db, undefined, { userId: "a", packageDir: null, instanceRoot })).toBe("skipped");
    importBundle.mockRejectedValueOnce(new Error("boom"));
    expect(await ensureStarterCompany({} as Db, undefined, { userId: "a", packageDir: await makePackage(), instanceRoot })).toBe("failed");
    // Failure leaves no marker, so the next boot retries.
    expect(await ensureStarterCompany({} as Db, undefined, { userId: "a", packageDir: await makePackage(), instanceRoot })).toBe("imported");
  });
});
