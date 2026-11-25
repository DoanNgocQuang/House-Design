import { afterEach, describe, expect, it, vi } from "vitest";
import { agentTaskDepthLimit, placeTaskParent, type ParentChainRow } from "../services/issue-hierarchy.js";

const row = (id: string, parentId: string | null): ParentChainRow => ({
  id, identifier: id.toUpperCase(), parentId, conversationAgentId: null, executionPolicy: null,
});
// requested parent first, root last: d -> c -> b -> a (a is the root, d sits at depth 4)
const chain = [row("d", "c"), row("c", "b"), row("b", "a"), row("a", null)];

afterEach(() => vi.unstubAllEnvs());

describe("agent task depth limit", () => {
  it("keeps the upstream limit of 2 when PAPERCLIP_MAX_AGENT_TASK_DEPTH is unset or invalid", () => {
    expect(agentTaskDepthLimit()).toBe(2);
    for (const value of ["", "abc", "1", "0", "-3", "2.5"]) {
      vi.stubEnv("PAPERCLIP_MAX_AGENT_TASK_DEPTH", value);
      expect(agentTaskDepthLimit()).toBe(2);
    }
    expect(placeTaskParent(chain, "flatten").adjustment?.reason).toBe("max_agent_depth");
  });

  it("lets agents build Epic -> Task -> Sub-task trees when the limit is raised to 5", () => {
    vi.stubEnv("PAPERCLIP_MAX_AGENT_TASK_DEPTH", "5");
    expect(agentTaskDepthLimit()).toBe(5);
    expect(placeTaskParent(chain, "flatten")).toEqual({ effectiveParentId: "d", adjustment: null });
    const deeper = [row("e", "d"), ...chain];
    expect(placeTaskParent(deeper, "flatten").effectiveParentId).toBe("d");
  });
});
