import { describe, expect, it } from "vitest";
import { formatCost, formatDuration, groupWakeReasons, wakeGroup } from "./agent-stats";

describe("wake reason groups", () => {
  it("maps raw reasons to chart groups", () => {
    expect(wakeGroup("issue_assigned")).toBe("assigned");
    expect(wakeGroup("assignment")).toBe("assigned");
    expect(wakeGroup("issue_commented")).toBe("commented");
    expect(wakeGroup("issue_blockers_resolved")).toBe("blockers");
    expect(wakeGroup("issue_unblock_requested")).toBe("blockers");
    expect(wakeGroup("issue_children_completed")).toBe("children");
    expect(wakeGroup("provider_limit_retry")).toBe("retry");
    expect(wakeGroup("heartbeat_timer")).toBe("timer");
    expect(wakeGroup("office_discussion_turn")).toBe("meeting");
    expect(wakeGroup("issue_disposition_repair")).toBe("other");
  });

  it("sums counts per group", () => {
    const totals = groupWakeReasons([
      { reason: "issue_commented", count: 9 }, { reason: "on_demand", count: 1 }, { reason: "transient_failure_retry", count: 3 },
    ]);
    expect(totals).toMatchObject({ commented: 9, other: 1, retry: 3, assigned: 0 });
  });
});

describe("formatting", () => {
  it("formats durations and costs", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(200)).toBe("3m 20s");
    expect(formatDuration(7500)).toBe("2h 5m");
    expect(formatDuration(null)).toBe("—");
    expect(formatCost(null)).toBe("—");
    expect(formatCost(1234)).toBe("$12.34");
  });
});
