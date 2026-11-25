function normalizeAllowlist(values) {
    if (!Array.isArray(values))
        return new Set();
    return new Set(values
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0));
}
export function validateTelegramAllowlists(config) {
    const errors = [];
    for (const key of ["allowedTelegramUserIds", "allowedTelegramChatIds"]) {
        const value = config[key];
        if (value === undefined || Array.isArray(value))
            continue;
        errors.push(`${key} must be an array of Telegram ID strings. Leave it empty to allow any ${key === "allowedTelegramUserIds" ? "user" : "chat"}.`);
    }
    return errors;
}
export function isTelegramUpdateAllowed(config, update) {
    const allowedUserIds = normalizeAllowlist(config.allowedTelegramUserIds);
    const allowedChatIds = normalizeAllowlist(config.allowedTelegramChatIds);
    if (allowedUserIds.size === 0 && allowedChatIds.size === 0) {
        return true;
    }
    const fromId = update.message?.from?.id ?? update.callback_query?.from.id;
    const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
    if (allowedUserIds.size > 0 && (!fromId || !allowedUserIds.has(String(fromId)))) {
        return false;
    }
    if (allowedChatIds.size > 0 && (!chatId || !allowedChatIds.has(String(chatId)))) {
        return false;
    }
    return true;
}
