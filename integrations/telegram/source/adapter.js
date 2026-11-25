import { sendMessage, editMessage as editTelegramMessage, escapeMarkdownV2, } from "./telegram-api.js";
export class TelegramAdapter {
    ctx;
    botToken;
    platformId = "telegram";
    constructor(ctx, botToken) {
        this.ctx = ctx;
        this.botToken = botToken;
    }
    async sendText(chatId, threadId, text, opts) {
        const options = {
            parseMode: "MarkdownV2",
        };
        if (threadId)
            options.messageThreadId = Number(threadId);
        if (opts?.replyTo)
            options.replyToMessageId = Number(opts.replyTo);
        if (opts?.silent)
            options.disableNotification = true;
        const messageId = await sendMessage(this.ctx, this.botToken, chatId, text, options);
        return {
            chatId,
            threadId: threadId || "",
            messageId: String(messageId ?? ""),
        };
    }
    async sendButtons(chatId, threadId, text, buttons) {
        const keyboard = [];
        for (let i = 0; i < buttons.length; i += 2) {
            const row = buttons.slice(i, i + 2).map((b) => ({
                text: b.label,
                callback_data: b.callbackData,
            }));
            keyboard.push(row);
        }
        const options = {
            parseMode: "MarkdownV2",
            inlineKeyboard: keyboard,
        };
        if (threadId)
            options.messageThreadId = Number(threadId);
        const messageId = await sendMessage(this.ctx, this.botToken, chatId, text, options);
        return {
            chatId,
            threadId: threadId || "",
            messageId: String(messageId ?? ""),
        };
    }
    async editMessage(ref, text, buttons) {
        const keyboard = buttons
            ? (() => {
                const rows = [];
                for (let i = 0; i < buttons.length; i += 2) {
                    const row = buttons.slice(i, i + 2).map((b) => ({
                        text: b.label,
                        callback_data: b.callbackData,
                    }));
                    rows.push(row);
                }
                return rows;
            })()
            : undefined;
        await editTelegramMessage(this.ctx, this.botToken, ref.chatId, Number(ref.messageId), text, { parseMode: "MarkdownV2", inlineKeyboard: keyboard });
    }
    formatAgentLabel(agentName) {
        return `*\\[${escapeMarkdownV2(agentName)}\\]*`;
    }
    formatMention(userId) {
        return `@${escapeMarkdownV2(userId)}`;
    }
    formatCodeBlock(code, lang) {
        return lang ? `\`\`\`${lang}\n${code}\n\`\`\`` : `\`\`\`\n${code}\n\`\`\``;
    }
}
