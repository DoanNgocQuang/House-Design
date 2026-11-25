import { describe, expect, it } from "vitest";
import { issueHierarchyKind } from "../routes/issues.js";

describe("issueHierarchyKind", () => {
  // request (root, given to the CEO) <- epic (CEO -> PM) <- task <- subtask <- deeper; "hidden" is unreadable.
  const links = new Map<string, string | null>([
    ["request", null], ["epic", "request"], ["task", "epic"], ["subtask", "task"], ["orphan-parent", "hidden"],
  ]);

  it("labels the delegated levels: request, epic, task, subtask", () => {
    expect(issueHierarchyKind(null, links)).toBe("request");
    expect(issueHierarchyKind("request", links)).toBe("epic");
    expect(issueHierarchyKind("epic", links)).toBe("task");
    expect(issueHierarchyKind("task", links)).toBe("subtask");
    expect(issueHierarchyKind("subtask", links)).toBe("subtask");
  });

  it("returns null when an ancestor is unreadable", () => {
    expect(issueHierarchyKind("hidden", links)).toBeNull();
    expect(issueHierarchyKind("orphan-parent", links)).toBeNull();
  });
});
