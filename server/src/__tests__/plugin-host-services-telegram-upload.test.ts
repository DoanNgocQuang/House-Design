import { describe, expect, it, vi } from "vitest";
import { buildHostServices } from "../services/plugin-host-services.js";

// A public address, so the SSRF guard lets the request reach the Telegram upload gate.
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "149.154.167.220", family: 4 }]),
}));

const eventBus = { forPlugin: () => ({ emit: vi.fn(), subscribe: vi.fn() }) } as never;
const uploadUrl = "https://api.telegram.org/bot123:abc_DEF-9/sendDocument";

function upload(pluginKey: string, url = uploadUrl, body = Buffer.from("file").toString("base64")) {
  const services = buildHostServices({} as never, "plugin-record-id", pluginKey, eventBus);
  return services.http.fetch({
    url,
    init: {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=x",
        "x-paperclip-telegram-multipart": "base64",
      },
      body,
    },
  } as never);
}

describe("Telegram binary upload gate", () => {
  it("refuses the binary upload header from any other plugin", async () => {
    await expect(upload("some-other-plugin")).rejects.toThrow("Invalid Telegram document upload");
  });

  it("refuses Telegram API paths other than sendDocument", async () => {
    await expect(upload("paperclip-plugin-telegram", "https://api.telegram.org/bot123:abc/sendMessage"))
      .rejects.toThrow("Invalid Telegram document upload");
  });

  it("refuses a body that is not base64", async () => {
    await expect(upload("paperclip-plugin-telegram", uploadUrl, "not base64!"))
      .rejects.toThrow("Invalid Telegram document upload");
  });
});
