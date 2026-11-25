// Sends a finished house to the owner's Telegram: render, floor plan, perspective (as images) and the 3D model.
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ISSUES = 400;
const MAX_DEPTH = 5;
const KINDS = [
    { key: "render", match: /^render\.png$/i, caption: "Ảnh phối cảnh thật", photo: true },
    { key: "plan", match: /^plan\.svg$/i, caption: "Mặt bằng", photo: true, png: true },
    { key: "iso", match: /^iso\.svg$/i, caption: "Phối cảnh tổng thể", photo: true, png: true },
    { key: "model", match: /\.glb$/i, caption: "Mô hình 3D (mở bằng ứng dụng xem file .glb)" },
];

const rows = (value) => (Array.isArray(value) ? value : value?.items ?? value?.issues ?? []);

/**
 * One file of each deliverable kind, in the order they are sent; empty unless a 3D model exists. Drawings come from the
 * task that holds the newest model: other tasks keep earlier stages under the same names (a plan before furniture).
 */
export function pickDeliverables(files) {
    const newest = (kind, list) => list
        .filter((file) => kind.match.test(file.originalFilename ?? ""))
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    const model = newest(KINDS.find((kind) => kind.key === "model"), files);
    if (!model) return [];
    return KINDS.flatMap((kind) => {
        const file = newest(kind, files.filter((item) => item.issueId === model.issueId)) ?? newest(kind, files);
        return file ? [{ ...kind, file }] : [];
    });
}

async function collectFiles(getJson, companyId, rootId) {
    const seen = new Set([rootId]);
    let level = [rootId];
    for (let depth = 0; level.length && depth < MAX_DEPTH && seen.size < MAX_ISSUES; depth++) {
        const next = [];
        for (let i = 0; i < level.length; i += 100) {
            const children = rows(await getJson(`/api/companies/${companyId}/issues?view=index&limit=${MAX_ISSUES}&parentIds=${level.slice(i, i + 100).join(",")}`));
            for (const child of children) {
                if (!seen.has(child.id) && child.status !== "cancelled" && seen.size < MAX_ISSUES) {
                    seen.add(child.id);
                    next.push(child.id);
                }
            }
        }
        level = next;
    }
    const files = [];
    for (const id of seen) files.push(...rows(await getJson(`/api/issues/${id}/attachments`)));
    return files;
}

/** Only a request or the Epic right under it delivers: deeper tasks finish many times on the way. */
export const isHouseRoot = (issue, parent) => !issue.parentId || Boolean(parent && !parent.parentId);

export async function sendDeliverables(ctx, { issue, companyId, chatId, getJson, getBytes, sendFile }) {
    const picked = pickDeliverables(await collectFiles(getJson, companyId, issue.id));
    let sent = 0;
    let skipped = 0;
    for (const item of picked) {
        const { file } = item;
        const state = { scopeKind: "instance", stateKey: `tg_deliverable_${chatId}_${file.sha256}` };
        try {
            if (await ctx.state.get(state)) continue;
            if (!(file.byteSize > 0 && file.byteSize <= MAX_BYTES)) { skipped++; continue; }
            const content = `/api/attachments/${file.id}/content`;
            const caption = `${item.caption} · ${issue.title}`.slice(0, 1000);
            let delivered = false;
            if (item.photo) {
                try {
                    const bytes = await getBytes(item.png ? `${content}?as=png` : content);
                    delivered = bytes.length <= MAX_BYTES &&
                        await sendFile({ kind: "photo", filename: file.originalFilename.replace(/\.svg$/i, ".png"), bytes, caption });
                } catch (error) {
                    ctx.logger.warn("Telegram image preview failed; sending the original file", { error: String(error) });
                }
            }
            if (!delivered) delivered = await sendFile({ kind: "document", filename: file.originalFilename, bytes: await getBytes(content), caption });
            if (!delivered) { skipped++; continue; }
            await ctx.state.set(state, true);
            sent++;
        } catch (error) {
            skipped++;
            ctx.logger.warn("Telegram deliverable could not be sent", { error: String(error) });
        }
    }
    return { sent, skipped };
}
