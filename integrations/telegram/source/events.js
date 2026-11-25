/**
 * Emit a host event, logging and swallowing any failure.
 *
 * Never throws — that is the entire point of the module. Returns nothing:
 * no call site can act on whether the event landed, and inventing a
 * result nobody reads would just be a second thing to keep correct.
 *
 * @param site Short description of the call site ("escalation reply"),
 *   logged as a field so one log message serves all call sites.
 */
export async function emitOrLog(ctx, event, companyId, payload, site, ids = {}) {
    try {
        await ctx.events.emit(event, companyId, payload);
    }
    catch (err) {
        ctx.logger.error("Failed to emit host event", {
            event,
            // The payload discriminator, as a field rather than baked into the
            // message — one event name with three `type`s is still one event.
            type: typeof payload.type === "string" ? payload.type : undefined,
            site,
            companyId,
            ...ids,
            error: String(err),
        });
    }
}
