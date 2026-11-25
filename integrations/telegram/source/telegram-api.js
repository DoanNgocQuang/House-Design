import { METRIC_NAMES } from "./constants.js";
const TELEGRAM_API = "https://api.telegram.org";
export async function sendMessage(ctx, token, chatId, text, options = {}) {
    const body = {
        chat_id: chatId,
        text,
    };
    if (options.parseMode)
        body.parse_mode = options.parseMode;
    if (options.replyToMessageId)
        body.reply_to_message_id = options.replyToMessageId;
    if (options.messageThreadId)
        body.message_thread_id = options.messageThreadId;
    if (options.disableNotification)
        body.disable_notification = true;
    if (options.inlineKeyboard) {
        body.reply_markup = {
            inline_keyboard: options.inlineKeyboard,
        };
    }
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await ctx.http.fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = (await res.json());
            if (!data.ok) {
                if (data.parameters?.retry_after && attempt < 2) {
                    const wait = data.parameters.retry_after * 1000;
                    ctx.logger.warn("Telegram rate limited, retrying", { retryAfter: data.parameters.retry_after, attempt });
                    await new Promise((r) => setTimeout(r, wait));
                    continue;
                }
                if (options.parseMode === "MarkdownV2") {
                    ctx.logger.warn("MarkdownV2 send failed, retrying as plain text", {
                        error: data.description,
                    });
                    return sendMessage(ctx, token, chatId, stripMarkdown(text), {
                        ...options,
                        parseMode: undefined,
                    });
                }
                ctx.logger.error("Telegram sendMessage failed", { error: data.description });
                await ctx.metrics.write(METRIC_NAMES.failed, 1);
                return null;
            }
            await ctx.metrics.write(METRIC_NAMES.sent, 1);
            return data.result?.message_id ?? null;
        }
        catch (err) {
            ctx.logger.error("Telegram API error", { error: String(err) });
            await ctx.metrics.write(METRIC_NAMES.failed, 1);
            return null;
        }
    }
    return null;
}
/** Uploads one file. Sent straight to Telegram: a 5 MB model can outlast the 30-second limit of a host call. */
export async function sendFile(ctx, token, chatId, { kind = "document", filename, bytes, caption }) {
    const form = new FormData();
    form.append("chat_id", chatId);
    if (caption) form.append("caption", caption);
    form.append(kind, new Blob([bytes]), filename.replace(/[\x00-\x1f\x7f"\\/]/g, "_").slice(0, 180));
    try {
        const response = await fetch(`${TELEGRAM_API}/bot${token}/${kind === "photo" ? "sendPhoto" : "sendDocument"}`, {
            method: "POST", body: form, redirect: "error", signal: AbortSignal.timeout(150_000),
        });
        const data = await response.json();
        if (!data.ok) ctx.logger.warn("Telegram refused a file", { kind, error: data.description });
        return data.ok === true;
    } catch (error) {
        // A fetch error can quote the URL, which contains the bot token.
        throw new Error(`Telegram upload failed (${error?.name ?? "Error"})`);
    }
}
export async function editMessage(ctx, token, chatId, messageId, text, options = {}) {
    const body = {
        chat_id: chatId,
        message_id: messageId,
        text,
    };
    if (options.parseMode)
        body.parse_mode = options.parseMode;
    if (options.inlineKeyboard) {
        body.reply_markup = { inline_keyboard: options.inlineKeyboard };
    }
    else {
        body.reply_markup = { inline_keyboard: [] };
    }
    try {
        const res = await ctx.http.fetch(`${TELEGRAM_API}/bot${token}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = (await res.json());
        return data.ok;
    }
    catch (err) {
        ctx.logger.error("Telegram editMessage failed", { error: String(err) });
        return false;
    }
}
export async function answerCallbackQuery(ctx, token, callbackQueryId, text) {
    try {
        const res = await ctx.http.fetch(`${TELEGRAM_API}/bot${token}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
            }),
        });
        const data = (await res.json());
        if (!data.ok) {
            ctx.logger.error("Telegram answerCallbackQuery rejected", {
                callbackQueryId,
                error_code: data.error_code,
                description: data.description,
            });
        }
    }
    catch (err) {
        ctx.logger.error("Telegram answerCallbackQuery failed", { error: String(err) });
    }
}
export async function setMyCommands(ctx, token, commands) {
    try {
        const res = await ctx.http.fetch(`${TELEGRAM_API}/bot${token}/setMyCommands`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commands }),
        });
        const data = (await res.json());
        return data.ok;
    }
    catch (err) {
        ctx.logger.error("Telegram setMyCommands failed", { error: String(err) });
        return false;
    }
}
export async function sendChatAction(ctx, token, chatId, action = "typing") {
    try {
        await ctx.http.fetch(`${TELEGRAM_API}/bot${token}/sendChatAction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, action }),
        });
    }
    catch {
        // Typing indicator failures are non-critical
    }
}
/**
 * Check if a chat is a forum (has topics enabled).
 * Caches the result per chatId for the lifetime of the process.
 */
const forumCache = new Map();
export async function isForum(ctx, token, chatId) {
    const cached = forumCache.get(chatId);
    if (cached !== undefined)
        return cached;
    try {
        const res = await ctx.http.fetch(`${TELEGRAM_API}/bot${token}/getChat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId }),
        });
        const data = (await res.json());
        const result = data.ok && data.result?.is_forum === true;
        forumCache.set(chatId, result);
        return result;
    }
    catch {
        return false;
    }
}
/** General topic thread ID for forum groups. */
export const GENERAL_TOPIC_THREAD_ID = 1;
// MarkdownV2 requires escaping these characters
const MD_ESCAPE_CHARS = /([_*\[\]()~`>#+\-=|{}.!\\])/g;
export function escapeMarkdownV2(text) {
    return text.replace(MD_ESCAPE_CHARS, "\\$1");
}
export function truncateAtWord(text, maxLen) {
    if (text.length <= maxLen)
        return text;
    const truncated = text.slice(0, maxLen);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > maxLen * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "...";
}
function stripMarkdown(text) {
    return text
        .replace(/\\([_*\[\]()~`>#+\-=|{}.!\\])/g, "$1")
        .replace(/[*_`~]/g, "");
}
