// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { ProjectFiles } from "./ProjectFiles";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/api/client", () => ({ api: { get } }));
vi.mock("@/context/CompanyContext", () => ({ useCompany: () => ({ selectedCompanyId: "qld", selectedCompany: { issuePrefix: "QLD" } }) }));

const issue = { id: "i1", identifier: "QLD-95", title: "Dựng mô hình 3D", status: "done" };

it("lists project files with who made them, opens .glb in a new 3D tab and other files as links", async () => {
  get.mockResolvedValue({ files: [
    { attachmentId: "a1", filename: "nha-pho.glb", contentType: "model/gltf-binary", byteSize: 930156,
      createdAt: "2026-11-23T01:00:00.000Z", createdByAgent: "Dựng hình", issue },
    { attachmentId: "a2", filename: "layout.json", contentType: "application/json", byteSize: 2048,
      createdAt: "2026-11-23T00:00:00.000Z", createdByAgent: null, issue },
  ] });
  const client = new QueryClient();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  try {
    await act(async () => root.render(
      <MemoryRouter><QueryClientProvider client={client}><ProjectFiles companyId="qld" projectId="p1" /></QueryClientProvider></MemoryRouter>,
    ));
    await vi.waitFor(() => expect(host.textContent).toContain("layout.json"));
    expect(get).toHaveBeenCalledWith("/companies/qld/projects/p1/files", expect.anything());
    expect(host.textContent).toContain("Dựng hình");
    expect(host.textContent).toContain("Bạn");
    const open = [...host.querySelectorAll("a")].find((a) => a.textContent === "Mở")!;
    expect(open.getAttribute("href")).toBe("/api/attachments/a2/content");

    const view = [...host.querySelectorAll("a")].find((a) => a.textContent === "Xem 3D")!;
    expect(view.getAttribute("target")).toBe("_blank");
    expect(view.getAttribute("href")).toBe("/QLD/model-viewer/a1?issue=i1&name=nha-pho.glb");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
  }
});
