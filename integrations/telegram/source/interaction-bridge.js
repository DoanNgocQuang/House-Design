// Lets the owner answer agents' question forms and confirmations with Telegram buttons.
const MAX_OPTIONS = 80;
const MAX_TEXT = 4000;
const OPEN = { scopeKind: "instance", stateKey: "tg_question_open" };
const recordKey = (id) => ({ scopeKind: "instance", stateKey: `tg_question_${id}` });
const messageKey = (chat, message) => ({ scopeKind: "instance", stateKey: `tg_question_msg_${chat}_${message}` });
const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** One shape for both stored question formats; mirrors what the web form lets people answer. */
export function normalizeQuestions(payload) {
    if (payload?.questionSet?.questions) {
        return payload.questionSet.questions.map((q) => ({
            id: q.id, prompt: q.prompt, help: q.helpText ?? "", required: q.required === true,
            multi: q.answerMode === "multi_select", text: q.answerMode === "text",
            custom: q.answerMode === "text" || q.customAnswer?.enabled === true,
            options: (q.options ?? []).slice(0, MAX_OPTIONS),
        }));
    }
    return (payload?.questions ?? []).map((q) => {
        const options = (q.options ?? []).filter((option) => option.freeText !== true);
        const custom = q.allowOther !== false || options.length !== (q.options ?? []).length;
        return {
            id: q.id, prompt: q.prompt, help: q.helpText ?? "", required: q.required === true,
            multi: q.selectionMode === "multi", text: options.length === 0, custom, options: options.slice(0, MAX_OPTIONS),
        };
    });
}

const answerOf = (rec, q) => rec.answers[q.id] ?? { optionIds: [] };
const hasAnswer = (rec, q) => answerOf(rec, q).optionIds.length > 0 || Boolean(answerOf(rec, q).otherText?.trim());

function answerText(rec, q) {
    const answer = answerOf(rec, q);
    const labels = q.options.filter((option) => answer.optionIds.includes(option.id)).map((option) => option.label);
    if (answer.otherText) labels.push(answer.otherText);
    return labels.join(", ") || "(bỏ qua)";
}

const summary = (rec) => rec.questions.map((q, i) => `${i + 1}. ${q.prompt}\n→ ${answerText(rec, q)}`).join("\n\n");

/** The message for the record's current step: text plus buttons. */
export function renderStep(rec) {
    const head = `❓ ${rec.title} (${rec.identifier})`;
    if (rec.confirm) {
        const body = [head, "", rec.confirm.prompt, rec.confirm.details ? `\n${clip(rec.confirm.details, 1500)}` : "", `\n${rec.url}`].join("\n");
        if (rec.awaitReason) return { text: clip(`${body}\n\nTrả lời (reply) tin này để ghi lý do từ chối.`, MAX_TEXT), keyboard: [[{ text: "◀ Quay lại", callback_data: "tgq:0:b" }]] };
        return { text: clip(body, MAX_TEXT), keyboard: [[
            { text: `✅ ${rec.confirm.accept}`, callback_data: "tgq:0:a" },
            { text: `❌ ${rec.confirm.reject}`, callback_data: "tgq:0:r" },
        ]] };
    }
    const at = rec.index;
    if (at >= rec.questions.length) {
        return { text: clip(`${head}\n\nAnh/chị xem lại rồi bấm Gửi:\n\n${summary(rec)}`, MAX_TEXT), keyboard: [
            [{ text: "✅ Gửi", callback_data: `tgq:${at}:s` }],
            [{ text: "✏️ Sửa lại", callback_data: `tgq:${at}:e` }],
        ] };
    }
    const q = rec.questions[at];
    const answer = answerOf(rec, q);
    const lines = [head, `Câu ${at + 1}/${rec.questions.length}${q.required ? "" : " (không bắt buộc)"}`, "", q.prompt];
    if (q.help && q.help !== q.prompt) lines.push(q.help);
    if (q.options.length) lines.push("", ...q.options.map((option, i) => `${i + 1}. ${option.label}${option.description ? ` — ${option.description}` : ""}`));
    if (q.multi) lines.push("", "Chọn được nhiều mục, xong thì bấm Tiếp.");
    if (answer.otherText) lines.push("", `Ý của anh/chị: ${answer.otherText}`);
    if (q.custom) lines.push("", q.text ? "Trả lời (reply) tin này để ghi câu trả lời." : "Muốn ghi ý khác thì trả lời (reply) tin này.");
    const keyboard = q.options.map((option, i) => [{
        text: clip(`${answer.optionIds.includes(option.id) ? "✓ " : ""}${option.label}`, 60), callback_data: `tgq:${at}:o${i}`,
    }]);
    const nav = [];
    if (at > 0) nav.push({ text: "◀ Quay lại", callback_data: `tgq:${at}:b` });
    if (q.multi || hasAnswer(rec, q)) nav.push({ text: "Tiếp ▶", callback_data: `tgq:${at}:n` });
    else if (!q.required) nav.push({ text: "Bỏ qua ▶", callback_data: `tgq:${at}:n` });
    if (nav.length) keyboard.push(nav);
    return { text: clip(lines.join("\n"), MAX_TEXT), keyboard };
}

export function createInteractionBridge(ctx, { getRuntime, sendMessage, editMessage, answerCallbackQuery, api, issueUrl }) {
    const locks = new Map();
    const run = (id, fn) => {
        const next = (locks.get(id) ?? Promise.resolve()).catch(() => {}).then(fn);
        locks.set(id, next);
        return next.finally(() => { if (locks.get(id) === next) locks.delete(id); });
    };
    const allowed = (config, chat, user = chat) => {
        const listed = (ids, value) => Array.isArray(ids) && ids.some((id) => String(id).trim() === String(value));
        return /^[1-9][0-9]*$/.test(String(chat)) && String(config.defaultChatId ?? "").trim() === String(chat) &&
            listed(config.allowedTelegramChatIds, chat) && listed(config.allowedTelegramUserIds, user);
    };
    const load = (id) => ctx.state.get(recordKey(id));
    const save = (rec) => ctx.state.set(recordKey(rec.id), rec);
    const readInteraction = async (rec) =>
        (await api(rec.companyId, "GET", `/api/issues/${rec.issueId}/interactions`)).find((item) => item.id === rec.id);
    // Every open question shares one list, so each change must see the previous one.
    const trackOpen = (id, open) => run("open-list", async () => {
        const ids = (await ctx.state.get(OPEN)) ?? [];
        const rest = ids.filter((value) => value !== id);
        await ctx.state.set(OPEN, open ? [...rest, id].slice(-50) : rest);
    });

    async function finish(rec, text) {
        rec.done = true;
        await save(rec);
        await trackOpen(rec.id, false);
        const rt = getRuntime();
        if (rt && rec.messageId) await editMessage(ctx, rt.token, rec.chatId, rec.messageId, clip(text, MAX_TEXT));
    }

    async function present(rec, { fresh = false } = {}) {
        const rt = getRuntime();
        if (!rt) return;
        const { text, keyboard } = renderStep(rec);
        if (rec.messageId && !fresh) {
            await editMessage(ctx, rt.token, rec.chatId, rec.messageId, text, { inlineKeyboard: keyboard });
            return;
        }
        const messageId = await sendMessage(ctx, rt.token, rec.chatId, text, { inlineKeyboard: keyboard });
        if (!messageId) return; // tick() tries again
        if (rec.messageId) {
            await editMessage(ctx, rt.token, rec.chatId, rec.messageId, `❓ ${rec.title} (${rec.identifier})\n\nTiếp tục ở tin bên dưới.`);
        }
        rec.messageId = messageId;
        await ctx.state.set(messageKey(rec.chatId, messageId), rec.id);
        await save(rec);
    }

    /** Sends the decision to Paperclip. A refusal keeps the card open unless someone else already closed it. */
    async function submit(rec, path, body, doneText) {
        const rt = getRuntime();
        try {
            await api(rec.companyId, "POST", `/api/issues/${rec.issueId}/interactions/${rec.id}/${path}`, body);
        } catch (error) {
            let current;
            try { current = await readInteraction(rec); } catch { current = { status: "pending" }; }
            if (!current || current.status !== "pending") return finish(rec, `❓ ${rec.title} (${rec.identifier})\n\nCâu hỏi này đã được xử lý trước đó.`);
            ctx.logger.warn("Telegram answer was not accepted", { interactionId: rec.id, error: String(error) });
            if (rt) await sendMessage(ctx, rt.token, rec.chatId, clip(`Chưa gửi được câu trả lời. Anh/chị thử lại hoặc trả lời trong Paperclip: ${rec.url}\n${String(error)}`, 900));
            return;
        }
        await finish(rec, doneText);
    }

    async function press(rec, step, action) {
        if (rec.confirm) {
            if (action === "a") return submit(rec, "accept", {}, `✅ ${rec.title} (${rec.identifier})\n\nĐã chọn: ${rec.confirm.accept}`);
            if (action === "r" && !rec.confirm.reasonRequired) return submit(rec, "reject", {}, `❌ ${rec.title} (${rec.identifier})\n\nĐã chọn: ${rec.confirm.reject}`);
            rec.awaitReason = action === "r";
            await save(rec);
            return present(rec);
        }
        if (step >= rec.questions.length) {
            if (action === "s") {
                return submit(rec, "respond", {
                    answers: rec.questions.map((q) => ({ questionId: q.id, ...answerOf(rec, q) })),
                }, `✅ ${rec.title} (${rec.identifier})\n\nĐã gửi câu trả lời:\n\n${summary(rec)}`);
            }
            rec.index = 0;
        } else {
            const q = rec.questions[step];
            if (action === "b") rec.index = Math.max(0, step - 1);
            else if (action === "n") rec.index = step + 1;
            else {
                const option = q.options[Number(action.slice(1))];
                if (!option) return;
                const answer = answerOf(rec, q);
                if (q.multi) {
                    const on = answer.optionIds.includes(option.id);
                    rec.answers[q.id] = { ...answer, optionIds: on ? answer.optionIds.filter((id) => id !== option.id) : [...answer.optionIds, option.id] };
                } else {
                    rec.answers[q.id] = { optionIds: [option.id] };
                    rec.index = step + 1;
                }
            }
        }
        await save(rec);
        return present(rec);
    }

    async function open(companyId, issueId, interactionId) {
        const rt = getRuntime();
        const chatId = String(rt?.config.defaultChatId ?? "").trim();
        if (!rt || rt.companyId !== companyId || !allowed(rt.config, chatId)) return;
        const existing = await load(interactionId);
        if (existing?.messageId || existing?.done) return;
        const base = existing ?? { id: interactionId, companyId, issueId, chatId, index: 0, answers: {} };
        if (!existing) { await save(base); await trackOpen(interactionId, true); }
        const interaction = await readInteraction(base);
        if (!interaction || interaction.status !== "pending") return finish(base, "");
        const issue = await ctx.issues.get(issueId, companyId);
        const payload = interaction.payload ?? {};
        const rec = {
            ...base, identifier: issue?.identifier ?? "", url: await issueUrl(companyId, issue ?? { id: issueId }),
            title: clip(interaction.title ?? payload.title ?? payload.questionSet?.title ?? issue?.title ?? "Câu hỏi", 200),
        };
        if (interaction.kind === "ask_user_questions") rec.questions = normalizeQuestions(payload);
        // Approving a tool call or a secret needs the full details shown in Paperclip.
        else if (interaction.kind === "request_confirmation" && !payload.toolAction && !payload.secretProposal) {
            rec.confirm = { prompt: payload.prompt, details: payload.detailsMarkdown ?? "", accept: payload.acceptLabel ?? "Đồng ý",
                reject: payload.rejectLabel ?? "Từ chối", reasonRequired: payload.rejectRequiresReason === true };
        }
        const answerable = rec.confirm || (rec.questions?.length && rec.questions.every((q) => q.options.length || q.custom));
        if (!answerable) {
            await sendMessage(ctx, rt.token, chatId, `❓ ${rec.title} (${rec.identifier})\n\nCó việc cần anh/chị quyết định trong Paperclip: ${rec.url}`);
            return finish(rec, "");
        }
        await save(rec);
        await present(rec);
    }

    return {
        register() {
            ctx.events.on("issue.interaction.created", (event) => this.receiveCreated(event));
            ctx.events.on("issue.interaction.updated", (event) => this.receiveUpdated(event));
        },
        async receiveCreated(event) {
            const id = event.payload?.interactionId;
            // A question addressed to an agent is not the owner's to answer.
            if (!id || !event.companyId || !event.entityId || event.payload.addresseeAgentId) return;
            await run(id, () => open(event.companyId, event.entityId, id));
        },
        async receiveUpdated(event) {
            const id = event.payload?.interactionId;
            if (!id) return;
            // Our own submit still holds the lock here, so it has already marked the record done.
            await run(id, async () => {
                const rec = await load(id);
                if (!rec || rec.done) return;
                const current = await readInteraction(rec);
                if (current && current.status === "pending") return;
                await finish(rec, `❓ ${rec.title ?? "Câu hỏi"} (${rec.identifier ?? ""})\n\nCâu hỏi này đã được xử lý.`);
            });
        },
        async handleCallback(update, config) {
            const query = update.callback_query;
            const match = /^tgq:(\d{1,2}):([abersn]|o\d{1,2})$/.exec(query?.data ?? "");
            if (!match) return false;
            const rt = getRuntime();
            const chat = String(query.message?.chat?.id ?? "");
            const reply = (text) => (rt ? answerCallbackQuery(ctx, rt.token, query.id, text) : undefined);
            if (!rt || !allowed(config, chat, query.from?.id)) { await reply("Bạn không có quyền trả lời câu hỏi này."); return true; }
            const id = await ctx.state.get(messageKey(chat, query.message.message_id));
            if (!id) { await reply("Câu hỏi không còn hợp lệ."); return true; }
            try {
                await run(id, async () => {
                    const rec = await load(id);
                    if (!rec || rec.done) return reply("Câu hỏi đã được xử lý.");
                    const step = Number(match[1]);
                    if (!rec.confirm && step !== rec.index) return reply("Câu này đã chuyển bước.");
                    const q = rec.questions?.[step];
                    if (q && match[2] === "n" && q.required && !hasAnswer(rec, q)) return reply("Chọn ít nhất một mục.");
                    await reply();
                    await press(rec, step, match[2]);
                });
            } catch (error) {
                ctx.logger.warn("Telegram question button failed", { error: String(error) });
            }
            return true;
        },
        async handleReply(update, config) {
            const msg = update.message;
            const chat = String(msg?.chat?.id ?? "");
            if (!msg?.text || !msg.reply_to_message?.from?.is_bot || !allowed(config, chat, msg.from?.id)) return false;
            const id = await ctx.state.get(messageKey(chat, msg.reply_to_message.message_id));
            if (!id) return false;
            try {
                await run(id, async () => {
                    const rt = getRuntime();
                    const tell = (text) => (rt ? sendMessage(ctx, rt.token, chat, text) : undefined);
                    const rec = await load(id);
                    if (!rec || rec.done) return tell("Câu hỏi này đã được xử lý.");
                    const text = msg.text.trim();
                    if (text.length > MAX_TEXT) return tell("Câu trả lời dài quá 4000 ký tự, anh/chị rút gọn giúp.");
                    if (rec.confirm) {
                        if (!rec.awaitReason) return tell("Câu này trả lời bằng nút bấm.");
                        return submit(rec, "reject", { reason: text }, `❌ ${rec.title} (${rec.identifier})\n\nĐã từ chối: ${text}`);
                    }
                    const q = rec.questions[rec.index];
                    if (!q?.custom) return tell("Câu này trả lời bằng nút bấm.");
                    rec.answers[q.id] = { optionIds: q.multi ? answerOf(rec, q).optionIds : [], otherText: text };
                    if (!q.multi) rec.index += 1;
                    await save(rec);
                    // The owner's reply sits below the old card, so the next step goes below it.
                    await present(rec, { fresh: true });
                });
            } catch (error) {
                ctx.logger.warn("Telegram question reply failed", { error: String(error) });
            }
            return true;
        },
        /** Retries questions whose message could not be sent. */
        async tick(rt) {
            if (!rt) return;
            for (const id of (await ctx.state.get(OPEN)) ?? []) {
                const rec = await load(id);
                if (rec && !rec.done && !rec.messageId && rec.companyId === rt.companyId) {
                    await run(id, () => open(rec.companyId, rec.issueId, id));
                }
            }
        },
    };
}
