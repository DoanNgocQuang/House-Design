export const TELEGRAM_LAST_UPDATE_ID_STATE_KEY = "telegram-last-update-id";
export async function getPersistedTelegramUpdateOffset(ctx) {
    const saved = await ctx.state.get({
        scopeKind: "instance",
        stateKey: TELEGRAM_LAST_UPDATE_ID_STATE_KEY,
    });
    const updateId = typeof saved === "number"
        ? saved
        : typeof saved === "string"
            ? Number.parseInt(saved, 10)
            : null;
    return updateId !== null && Number.isSafeInteger(updateId) && updateId >= 0
        ? updateId
        : 0;
}
export async function persistTelegramUpdateOffset(ctx, updateId) {
    if (!Number.isSafeInteger(updateId) || updateId < 0)
        return;
    await ctx.state.set({
        scopeKind: "instance",
        stateKey: TELEGRAM_LAST_UPDATE_ID_STATE_KEY,
    }, updateId);
}
export async function handleTelegramUpdateThenPersistOffset(options) {
    const { updateId, lastUpdateId, handleUpdate, persistOffset, logger } = options;
    try {
        await handleUpdate();
    }
    catch (err) {
        logger.error("Telegram update handling failed", {
            updateId,
            error: String(err),
        });
        return lastUpdateId;
    }
    const nextUpdateId = Math.max(lastUpdateId, updateId);
    if (nextUpdateId <= lastUpdateId)
        return lastUpdateId;
    try {
        await persistOffset(nextUpdateId);
    }
    catch (err) {
        logger.error("Failed to persist Telegram polling offset", {
            updateId: nextUpdateId,
            error: String(err),
        });
    }
    return nextUpdateId;
}
export async function processTelegramUpdateBatch(options) {
    const { updates, handleUpdate, persistOffset, logger } = options;
    let lastUpdateId = options.lastUpdateId;
    for (const update of updates) {
        const nextUpdateId = await handleTelegramUpdateThenPersistOffset({
            updateId: update.update_id,
            lastUpdateId,
            handleUpdate: () => handleUpdate(update),
            persistOffset,
            logger,
        });
        if (nextUpdateId === lastUpdateId && update.update_id > lastUpdateId) {
            break;
        }
        lastUpdateId = nextUpdateId;
    }
    return lastUpdateId;
}
const BATCH = 10;
/**
 * Reads updates without trusting the saved id as a position. Telegram restarts ids at a random number
 * after a quiet spell, and asking from an old, higher id hides every new update. An offset is sent only
 * to confirm the batch just handled; the saved id only skips updates handled before a restart.
 */
export function createUpdatePoller({ fetchUpdates, readSavedId, saveId, handleUpdate, logger }) {
    let confirmFrom = null;
    return async function poll() {
        const result = await fetchUpdates(confirmFrom === null ? { limit: BATCH } : { limit: BATCH, offset: confirmFrom });
        if (!result) return null;
        confirmFrom = null;
        if (!result.length) return 0;
        const saved = await readSavedId();
        const handledBefore = (id) => id <= saved && id > saved - BATCH;
        const fresh = result.filter((update) => !handledBefore(update.update_id));
        let last = result[0].update_id - 1;
        if (fresh.length) {
            last = await processTelegramUpdateBatch({ updates: fresh, lastUpdateId: fresh[0].update_id - 1, handleUpdate, persistOffset: saveId, logger });
            if (last < fresh[0].update_id) return 0; // the first update failed: ask for it again
        } else last = result.at(-1).update_id;
        confirmFrom = last + 1;
        return fresh.length;
    };
}
