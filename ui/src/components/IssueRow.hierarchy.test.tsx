import { describe, expect, it } from "vitest";
import { taskHierarchyIcons } from "./IssueRow";

describe("task hierarchy icons", () => {
  it("gives each of the four levels its own label and icon", () => {
    expect(Object.keys(taskHierarchyIcons)).toEqual(["request", "epic", "task", "subtask"]);
    expect(taskHierarchyIcons.request.label).toBe("Yêu cầu");
    expect(new Set(Object.values(taskHierarchyIcons).map((entry) => entry.Icon)).size).toBe(4);
  });
});
