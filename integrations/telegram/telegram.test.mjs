import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isHouseRoot, pickDeliverables, sendDeliverables } from "./source/deliverables.js";
import { createInteractionBridge, normalizeQuestions } from "./source/interaction-bridge.js";
import { createUpdatePoller } from "./source/polling-offset.js";
import { sendFile } from "./source/telegram-api.js";

const form = JSON.parse(readFileSync(new URL("../studio-nha-3d/skills/chon-kieu-nha/questions.json", import.meta.url), "utf8"));
const CHAT = "42", CO = "company-1", ISSUE = "issue-1", ID = "interaction-1";
const config = { defaultChatId: CHAT, allowedTelegramChatIds: [CHAT], allowedTelegramUserIds: [CHAT] };
const logger = { info() {}, warn() {}, error() {} };

function memory() {
  const map = new Map();
  const key = (k) => `${k.scopeKind}:${k.scopeId ?? ""}:${k.stateKey}`;
  return { get: async (k) => structuredClone(map.get(key(k))), set: async (k, v) => void map.set(key(k), structuredClone(v)) };
}

function setup(interaction, { send = () => true, refuse } = {}) {
  const item = { id: ID, status: "pending", title: "Chọn kiểu nhà", ...interaction };
  const cards = new Map(), toasts = [], posts = [];
  let nextId = 0;
  const ctx = { logger, state: memory(), events: { on() {} }, issues: { get: async () => ({ id: ISSUE, identifier: "QLD-1", title: "Nhà" }) } };
  const bridge = createInteractionBridge(ctx, {
    getRuntime: () => ({ companyId: CO, token: "t", config }),
    sendMessage: async (_c, _t, _chat, text, options) => {
      if (!send()) return null;
      cards.set(++nextId, { text, keyboard: options?.inlineKeyboard ?? [] });
      return nextId;
    },
    editMessage: async (_c, _t, _chat, id, text, options) => void cards.set(id, { text, keyboard: options?.inlineKeyboard ?? [] }),
    answerCallbackQuery: async (_c, _t, _id, text) => void toasts.push(text),
    api: async (_co, method, path, body) => {
      if (method === "GET") return [item];
      if (refuse) { refuse(item); throw new Error("Paperclip API request failed with 409"); }
      posts.push({ path, body });
      item.status = "answered";
      return item;
    },
    issueUrl: async () => "http://localhost:3100/QLD/issues/QLD-1",
  });
  const press = (message, data, user = CHAT) =>
    bridge.handleCallback({ callback_query: { id: "q", data, from: { id: user }, message: { message_id: message, chat: { id: CHAT } } } }, config);
  const reply = (message, text) =>
    bridge.handleReply({ message: { message_id: 900, text, from: { id: CHAT }, chat: { id: CHAT }, reply_to_message: { message_id: message, from: { is_bot: true } } } }, config);
  const created = (payload = {}) => bridge.receiveCreated({ companyId: CO, entityId: ISSUE, payload: { interactionId: ID, ...payload } });
  return { bridge, cards, toasts, posts, press, reply, created, item, ctx };
}
const ask = { kind: "ask_user_questions", payload: form.payload };

test("answers the house form one question at a time", async () => {
  const t = setup(ask);
  await t.created();
  assert.match(t.cards.get(1).text, /Câu 1\/5/);
  assert.match(t.cards.get(1).text, /Nhà phố mái Thái — /);
  assert.equal(t.cards.get(1).keyboard[0][0].text, "Nhà phố mái Thái");
  await t.press(1, "tgq:0:o1");
  assert.match(t.cards.get(1).text, /Câu 2\/5/);
  // A second tap on the previous question must not answer this one.
  await t.press(1, "tgq:0:o3");
  assert.equal(t.toasts.at(-1), "Câu này đã chuyển bước.");
  await t.press(1, "tgq:1:b");
  assert.match(t.cards.get(1).text, /Câu 1\/5/);
  assert.equal(t.cards.get(1).keyboard[1][0].text, "✓ Nhà ống có sân thượng");
  await t.press(1, "tgq:0:n");
  await t.press(1, "tgq:1:o0");
  await t.press(1, "tgq:2:o1");
  await t.reply(1, "Lô 7x20m hướng Nam");
  // The next step is a new message below the owner's reply.
  assert.match(t.cards.get(1).text, /tin bên dưới/);
  assert.match(t.cards.get(2).text, /Câu 5\/5 \(không bắt buộc\)/);
  await t.press(2, "tgq:4:o0");
  await t.press(2, "tgq:4:o1");
  await t.press(2, "tgq:4:o0");
  await t.press(2, "tgq:4:n");
  assert.match(t.cards.get(2).text, /Lô 7x20m hướng Nam/);
  assert.equal(t.posts.length, 0);
  await t.press(2, "tgq:5:s");
  const q = form.payload.questionSet.questions;
  assert.deepEqual(t.posts, [{ path: `/api/issues/${ISSUE}/interactions/${ID}/respond`, body: { answers: [
    { questionId: "kieu-nha", optionIds: ["nha-ong-san-thuong"] },
    { questionId: "kieu-mai", optionIds: [q[1].options[0].id] },
    { questionId: "quy-mo", optionIds: [q[2].options[1].id] },
    { questionId: "lo-dat", optionIds: [], otherText: "Lô 7x20m hướng Nam" },
    { questionId: "san-vuon", optionIds: [q[4].options[1].id] },
  ] } }]);
  assert.match(t.cards.get(2).text, /Đã gửi câu trả lời/);
  assert.deepEqual(t.cards.get(2).keyboard, []);
  await t.press(2, "tgq:5:s");
  assert.equal(t.posts.length, 1);
  assert.equal(t.toasts.at(-1), "Câu hỏi đã được xử lý.");
});

test("ignores strangers, other bots' buttons and questions meant for an agent", async () => {
  const t = setup(ask);
  await t.created({ addresseeAgentId: "agent-1" });
  assert.equal(t.cards.size, 0);
  await t.created();
  assert.equal(await t.press(1, "tgq:0:o0", "666"), true);
  assert.match(t.toasts.at(-1), /không có quyền/);
  assert.match(t.cards.get(1).text, /Câu 1\/5/);
  assert.equal(await t.press(1, "office_choice:0"), false);
  assert.equal(await t.reply(77, "reply to another message"), false);
});

test("closes the card when the question was answered on the web", async () => {
  const t = setup(ask);
  await t.created();
  t.item.status = "answered";
  await t.bridge.receiveUpdated({ companyId: CO, payload: { interactionId: ID } });
  assert.match(t.cards.get(1).text, /đã được xử lý/);
  assert.deepEqual(t.cards.get(1).keyboard, []);
  await t.press(1, "tgq:0:o0");
  assert.equal(t.toasts.at(-1), "Câu hỏi đã được xử lý.");
});

test("keeps the card open when Paperclip refuses an answer that is still pending", async () => {
  const t = setup({ kind: "request_confirmation", payload: { prompt: "Duyệt?" } }, { refuse: () => {} });
  await t.created();
  await t.press(1, "tgq:0:a");
  assert.match(t.cards.get(2).text, /Chưa gửi được/);
  assert.equal(t.cards.get(1).keyboard.length, 1);
});

test("asks for the reason a rejection needs", async () => {
  const t = setup({ kind: "request_confirmation", title: "Duyệt mặt bằng", payload: { prompt: "Duyệt?", acceptLabel: "Duyệt", rejectLabel: "Sửa", rejectRequiresReason: true } });
  await t.created();
  assert.deepEqual(t.cards.get(1).keyboard[0].map((b) => b.text), ["✅ Duyệt", "❌ Sửa"]);
  await t.press(1, "tgq:0:r");
  assert.equal(t.posts.length, 0);
  await t.reply(1, "Bếp nhỏ quá");
  assert.deepEqual(t.posts, [{ path: `/api/issues/${ISSUE}/interactions/${ID}/reject`, body: { reason: "Bếp nhỏ quá" } }]);
});

test("sends only a link for decisions that need the full page", async () => {
  const t = setup({ kind: "request_confirmation", payload: { prompt: "Run tool?", toolAction: {} } });
  await t.created();
  assert.match(t.cards.get(1).text, /quyết định trong Paperclip: http/);
  assert.deepEqual(t.cards.get(1).keyboard, []);
});

test("retries a question Telegram did not accept", async () => {
  let up = false;
  const t = setup(ask, { send: () => up });
  await t.created();
  assert.equal(t.cards.size, 0);
  up = true;
  await t.bridge.tick({ companyId: CO });
  assert.match(t.cards.get(1).text, /Câu 1\/5/);
  await t.bridge.tick({ companyId: CO });
  assert.equal(t.cards.size, 1);
});

test("reads the older question format", () => {
  const [single, text] = normalizeQuestions({ questions: [
    { id: "a", prompt: "A?", required: true, selectionMode: "single", allowOther: false, options: [{ id: "x", label: "X" }] },
    { id: "b", prompt: "B?", selectionMode: "single", options: [{ id: "free", label: "…", freeText: true }] },
  ] });
  assert.deepEqual([single.custom, single.text, single.options.length], [false, false, 1]);
  assert.deepEqual([text.custom, text.text, text.options.length], [true, true, 0]);
});

const file = (id, name, createdAt, sha = id, byteSize = 10) => ({ id, originalFilename: name, createdAt, sha256: sha, byteSize });

test("sends a finished house once, newest files first in viewing order", async () => {
  const tree = {
    "epic": [{ id: "task", status: "done" }, { id: "dead", status: "cancelled" }],
    "task": [{ id: "sub", status: "done" }],
  };
  const files = {
    epic: [file("g2", "nha.glb", "2026-02-02")],
    sub: [file("g1", "nha.glb", "2026-01-01"), file("p", "plan.svg", "2026-01-01"), file("i", "iso.svg", "2026-01-01"), file("r", "render.png", "2026-01-01"), file("j", "layout.json", "2026-01-01")],
    dead: [file("x", "render.png", "2027-01-01")],
  };
  const sent = [];
  const ctx = { logger, state: memory() };
  const deps = {
    issue: { id: "epic", parentId: "request", title: "Epic nhà" }, companyId: CO, chatId: CHAT,
    getJson: async (path) => {
      const children = /parentIds=([^&]+)/.exec(path);
      if (children) return children[1].split(",").flatMap((id) => tree[id] ?? []);
      return files[/issues\/([^/]+)\/attachments/.exec(path)[1]] ?? [];
    },
    getBytes: async (path) => { if (path.includes("/i/")) throw new Error("cannot draw"); return Buffer.from(path); },
    sendFile: async (f) => { sent.push(`${f.kind}:${f.filename}`); return true; },
  };
  // The perspective cannot be drawn and cannot be read here, so it is reported, not silently lost.
  assert.deepEqual(await sendDeliverables(ctx, deps), { sent: 3, skipped: 1 });
  assert.deepEqual(sent, ["photo:render.png", "photo:plan.png", "document:nha.glb"]);
  assert.deepEqual(await sendDeliverables(ctx, { ...deps, issue: { id: "request", parentId: null, title: "Yêu cầu" }, getJson: async (p) => (p.includes("parentIds=request") ? [{ id: "epic", status: "done" }] : deps.getJson(p)), getBytes: async (p) => Buffer.from(p) }), { sent: 1, skipped: 0 });
  assert.equal(sent.at(-1), "photo:iso.png");
  // Deeper tasks finish many times before the house does.
  assert.equal(isHouseRoot({ id: "request", parentId: null }, null), true);
  assert.equal(isHouseRoot({ id: "epic", parentId: "request" }, { id: "request", parentId: null }), true);
  assert.equal(isHouseRoot({ id: "task", parentId: "epic" }, { id: "epic", parentId: "request" }), false);
  assert.equal(isHouseRoot({ id: "task", parentId: "gone" }, null), false);
});

test("takes the drawings that belong to the newest model, not a newer file of an earlier stage", () => {
  const at = (id, name, createdAt, issueId) => ({ ...file(id, name, createdAt), issueId });
  const picked = pickDeliverables([
    at("bare", "plan.svg", "2026-03-03", "draft"), at("iso", "iso.svg", "2026-01-01", "draft"),
    at("full", "plan.svg", "2026-02-02", "final"), at("glb", "nha.glb", "2026-02-02", "final"),
  ]);
  assert.deepEqual(picked.map((item) => item.file.id), ["full", "iso", "glb"]);
});

test("sends nothing without a 3D model", () => {
  assert.deepEqual(pickDeliverables([file("p", "plan.svg", "2026-01-01")]), []);
});

test("uploads a photo with its caption, without leaking the token on failure", async (context) => {
  let call;
  const fetchMock = context.mock.method(globalThis, "fetch", async (url, init) => { call = { url, init }; return { json: async () => ({ ok: true }) }; });
  const ctx = { logger };
  assert.equal(await sendFile(ctx, "1:abc", CHAT, { kind: "photo", filename: 'a"b.png', bytes: Buffer.from("BYTES"), caption: "Mặt bằng" }), true);
  assert.equal(call.url, "https://api.telegram.org/bot1:abc/sendPhoto");
  assert.equal(call.init.body.get("chat_id"), CHAT);
  assert.equal(call.init.body.get("caption"), "Mặt bằng");
  assert.equal(call.init.body.get("photo").name, "a_b.png");
  assert.equal(await call.init.body.get("photo").text(), "BYTES");
  fetchMock.mock.mockImplementation(async (url) => { throw new TypeError(`fetch failed: ${url}`); });
  await assert.rejects(sendFile(ctx, "1:abc", CHAT, { filename: "a.glb", bytes: Buffer.from("x") }), (error) => !error.message.includes("abc"));
});

test("reads updates whose ids restarted below the saved one, and handles each once", async () => {
  // Like Telegram: an offset confirms everything below it and filters what is returned.
  let queue = [{ update_id: 500 }, { update_id: 501 }], saved = 895114280, failOnce = true;
  const handled = [], asked = [];
  const make = () => createUpdatePoller({
    logger, readSavedId: async () => saved, saveId: async (id) => { saved = id; },
    fetchUpdates: async ({ offset }) => { asked.push(offset); if (offset !== undefined) queue = queue.filter((u) => u.update_id >= offset); return structuredClone(queue); },
    handleUpdate: async (u) => { if (failOnce) { failOnce = false; throw new Error("down"); } handled.push(u.update_id); },
  });
  let poll = make();
  await poll();
  assert.deepEqual(handled, []);
  await poll();
  assert.deepEqual([handled, saved], [[500, 501], 501]);
  // A restart before the batch was confirmed must not handle it again.
  poll = make();
  queue.push({ update_id: 502 });
  await poll();
  assert.deepEqual(handled, [500, 501, 502]);
  await poll();
  await poll();
  assert.deepEqual([handled, queue, asked.at(-1)], [[500, 501, 502], [], undefined]);
});
