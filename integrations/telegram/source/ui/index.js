import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { usePluginAction, usePluginData, } from "@paperclipai/plugin-sdk/ui";
const TELEGRAM_PLUGIN_ID = "paperclip-plugin-telegram";
const DEFAULT_ROUTING_CONFIG = {
    defaultChatId: "",
    topicRouting: false,
    maxAgentsPerThread: 5,
    notifyOnIssueCreated: true,
    notifyOnIssueDone: true,
    notifyOnIssueAssigned: false,
    onlyNotifyIfAssignedTo: "",
    approvalsChatId: "",
    approvalsTopicId: "",
    notifyOnApprovalCreated: true,
    onlyNotifyBoardApprovals: false,
    errorsChatId: "",
    errorsTopicId: "",
    notifyOnAgentError: true,
    notifyOnAgentRunStarted: false,
    notifyOnAgentRunFinished: false,
    digestChatId: "",
    digestTopicId: "",
    digestMode: "off",
    dailyDigestTime: "09:00",
    bidailySecondTime: "17:00",
    tridailyTimes: "07:00,13:00,19:00",
};
const DEFAULT_CONNECTION_CONFIG = {
    telegramBotTokenRef: "",
    paperclipBaseUrl: "http://localhost:3100",
    paperclipPublicUrl: "",
};
const DEFAULT_BOARD_CONFIG = {
    paperclipBoardApiTokenRef: "",
};
const DEFAULT_ACCESS_CONFIG = {
    enableCommands: true,
    enableInbound: true,
    allowedTelegramUserIds: [],
    allowedTelegramChatIds: [],
};
const DEFAULT_MEDIA_CONFIG = {
    transcriptionApiKeyRef: "",
    briefAgentId: "",
    briefAgentChatIds: [],
};
const DEFAULT_ESCALATION_CONFIG = {
    escalationChatId: "",
    escalationTimeoutMs: 900000,
    escalationDefaultAction: "defer",
    escalationHoldMessage: "Let me check on that - I'll get back to you shortly.",
};
const DEFAULT_PROACTIVE_CONFIG = {
    maxSuggestionsPerHourPerCompany: 10,
    watchDeduplicationWindowMs: 86400000,
};
const standardInputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    minWidth: 0,
    padding: "9px 10px",
};
const helperTextStyle = {
    color: "#6b7280",
    fontSize: 12,
    lineHeight: "16px",
};
const twoColumnGridStyle = {
    alignItems: "stretch",
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
};
const pairedFieldStyle = {
    display: "grid",
    gap: 5,
    gridTemplateRows: "auto auto minmax(32px, auto)",
};
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function asString(value) {
    return typeof value === "string" ? value : "";
}
function asBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
}
function asNumber(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function asStringArray(value) {
    return Array.isArray(value)
        ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : [];
}
function asDigestMode(value) {
    return value === "daily" || value === "bidaily" || value === "tridaily" ? value : "off";
}
function asEscalationDefaultAction(value) {
    return value === "auto_reply" || value === "close" ? value : "defer";
}
function extractRoutingConfig(config) {
    return {
        defaultChatId: asString(config.defaultChatId),
        topicRouting: asBoolean(config.topicRouting, DEFAULT_ROUTING_CONFIG.topicRouting),
        maxAgentsPerThread: asNumber(config.maxAgentsPerThread, DEFAULT_ROUTING_CONFIG.maxAgentsPerThread),
        notifyOnIssueCreated: asBoolean(config.notifyOnIssueCreated, DEFAULT_ROUTING_CONFIG.notifyOnIssueCreated),
        notifyOnIssueDone: asBoolean(config.notifyOnIssueDone, DEFAULT_ROUTING_CONFIG.notifyOnIssueDone),
        notifyOnIssueAssigned: asBoolean(config.notifyOnIssueAssigned, DEFAULT_ROUTING_CONFIG.notifyOnIssueAssigned),
        onlyNotifyIfAssignedTo: asString(config.onlyNotifyIfAssignedTo),
        approvalsChatId: asString(config.approvalsChatId),
        approvalsTopicId: asString(config.approvalsTopicId),
        notifyOnApprovalCreated: asBoolean(config.notifyOnApprovalCreated, DEFAULT_ROUTING_CONFIG.notifyOnApprovalCreated),
        onlyNotifyBoardApprovals: asBoolean(config.onlyNotifyBoardApprovals, DEFAULT_ROUTING_CONFIG.onlyNotifyBoardApprovals),
        errorsChatId: asString(config.errorsChatId),
        errorsTopicId: asString(config.errorsTopicId),
        notifyOnAgentError: asBoolean(config.notifyOnAgentError, DEFAULT_ROUTING_CONFIG.notifyOnAgentError),
        notifyOnAgentRunStarted: asBoolean(config.notifyOnAgentRunStarted, DEFAULT_ROUTING_CONFIG.notifyOnAgentRunStarted),
        notifyOnAgentRunFinished: asBoolean(config.notifyOnAgentRunFinished, DEFAULT_ROUTING_CONFIG.notifyOnAgentRunFinished),
        digestChatId: asString(config.digestChatId),
        digestTopicId: asString(config.digestTopicId),
        digestMode: asDigestMode(config.digestMode),
        dailyDigestTime: asString(config.dailyDigestTime) || DEFAULT_ROUTING_CONFIG.dailyDigestTime,
        bidailySecondTime: asString(config.bidailySecondTime) || DEFAULT_ROUTING_CONFIG.bidailySecondTime,
        tridailyTimes: asString(config.tridailyTimes) || DEFAULT_ROUTING_CONFIG.tridailyTimes,
    };
}
function extractConnectionConfig(config) {
    return {
        telegramBotTokenRef: secretRefId(config.telegramBotTokenRef),
        paperclipBaseUrl: asString(config.paperclipBaseUrl) || DEFAULT_CONNECTION_CONFIG.paperclipBaseUrl,
        paperclipPublicUrl: asString(config.paperclipPublicUrl),
    };
}
function extractBoardConfig(config) {
    return {
        paperclipBoardApiTokenRef: secretRefId(config.paperclipBoardApiTokenRef),
    };
}
function extractAccessConfig(config) {
    return {
        enableCommands: asBoolean(config.enableCommands, DEFAULT_ACCESS_CONFIG.enableCommands),
        enableInbound: asBoolean(config.enableInbound, DEFAULT_ACCESS_CONFIG.enableInbound),
        allowedTelegramUserIds: asStringArray(config.allowedTelegramUserIds),
        allowedTelegramChatIds: asStringArray(config.allowedTelegramChatIds),
    };
}
function extractMediaConfig(config) {
    return {
        transcriptionApiKeyRef: secretRefId(config.transcriptionApiKeyRef),
        briefAgentId: asString(config.briefAgentId),
        briefAgentChatIds: asStringArray(config.briefAgentChatIds),
    };
}
function extractEscalationConfig(config) {
    return {
        escalationChatId: asString(config.escalationChatId),
        escalationTimeoutMs: asNumber(config.escalationTimeoutMs, DEFAULT_ESCALATION_CONFIG.escalationTimeoutMs),
        escalationDefaultAction: asEscalationDefaultAction(config.escalationDefaultAction),
        escalationHoldMessage: asString(config.escalationHoldMessage) || DEFAULT_ESCALATION_CONFIG.escalationHoldMessage,
    };
}
function extractProactiveConfig(config) {
    return {
        maxSuggestionsPerHourPerCompany: asNumber(config.maxSuggestionsPerHourPerCompany, DEFAULT_PROACTIVE_CONFIG.maxSuggestionsPerHourPerCompany),
        watchDeduplicationWindowMs: asNumber(config.watchDeduplicationWindowMs, DEFAULT_PROACTIVE_CONFIG.watchDeduplicationWindowMs),
    };
}
async function fetchHostJson(input, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    if (typeof init.body === "string" && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }
    const response = await fetch(input, {
        ...init,
        headers,
        credentials: init.credentials ?? "same-origin",
    });
    const rawBody = await response.text();
    const normalizedBody = rawBody.trim();
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") ||
        normalizedBody.startsWith("<!DOCTYPE html") ||
        normalizedBody.startsWith("<html")) {
        throw new Error("Paperclip returned HTML instead of JSON.");
    }
    let payload = null;
    if (normalizedBody) {
        try {
            payload = JSON.parse(normalizedBody);
        }
        catch {
            throw new Error("Paperclip returned an unexpected response.");
        }
    }
    if (!response.ok) {
        const message = typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : `Request failed with status ${response.status}.`;
        throw new Error(message);
    }
    return payload;
}
function resolveBrowserOrigin() {
    if (typeof window === "undefined" || typeof window.location?.origin !== "string") {
        return null;
    }
    const origin = window.location.origin.trim();
    if (!origin || origin === "null") {
        return null;
    }
    try {
        const normalizedOrigin = new URL(origin);
        if (normalizedOrigin.protocol !== "http:" && normalizedOrigin.protocol !== "https:") {
            return null;
        }
        return normalizedOrigin.origin;
    }
    catch {
        return null;
    }
}
function buildPaperclipUrl(input) {
    const origin = resolveBrowserOrigin();
    if (!origin || !input.trim() || input.trim().startsWith("//")) {
        return null;
    }
    try {
        const candidate = new URL(input.trim(), origin);
        return candidate.origin === origin ? candidate.toString() : null;
    }
    catch {
        return null;
    }
}
function resolveCliAuthUrl(url, path) {
    const relative = typeof path === "string" ? path.trim() : "";
    for (const input of [relative.startsWith("/cli-auth/") ? relative : "", typeof url === "string" ? url : ""]) {
        const trusted = buildPaperclipUrl(input);
        if (!trusted) continue;
        const candidate = new URL(trusted);
        if (/^\/cli-auth\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(candidate.pathname) &&
            candidate.searchParams.get("token")) {
            return trusted;
        }
    }
    return null;
}
function resolveCliAuthPollUrl(urlOrPath) {
    if (typeof urlOrPath !== "string" || !urlOrPath.trim()) {
        return null;
    }
    const trimmed = urlOrPath.trim();
    if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed)) {
        return buildPaperclipUrl(trimmed);
    }
    const normalizedPath = trimmed.startsWith("/api/")
        ? trimmed
        : `/api${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
    return buildPaperclipUrl(normalizedPath);
}
function normalizePollIntervalMs(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        return 1500;
    }
    return Math.min(5000, Math.max(750, Math.floor(value)));
}
function waitForDuration(durationMs) {
    return new Promise((resolve) => {
        globalThis.setTimeout(resolve, durationMs);
    });
}
async function requestBoardAccessChallenge(companyId) {
    return fetchHostJson("/api/cli-auth/challenges", {
        method: "POST",
        body: JSON.stringify({
            command: "paperclip plugin telegram settings",
            clientName: "Telegram plugin",
            requestedAccess: "board",
            requestedCompanyId: companyId,
        }),
    });
}
async function waitForBoardAccessApproval(challenge) {
    const challengeToken = typeof challenge.token === "string" ? challenge.token.trim() : "";
    const pollUrl = resolveCliAuthPollUrl(challenge.pollUrl ?? challenge.pollPath);
    if (!challengeToken || !pollUrl) {
        throw new Error("Paperclip did not return a trusted board access challenge.");
    }
    const expiresAtTimeMs = typeof challenge.expiresAt === "string" ? Date.parse(challenge.expiresAt) : Number.NaN;
    const pollIntervalMs = normalizePollIntervalMs(challenge.suggestedPollIntervalMs);
    while (true) {
        const pollUrlWithToken = new URL(pollUrl);
        pollUrlWithToken.searchParams.set("token", challengeToken);
        const pollResult = await fetchHostJson(pollUrlWithToken.toString());
        const status = typeof pollResult.status === "string" ? pollResult.status.trim().toLowerCase() : "pending";
        if (status === "approved") {
            const boardApiToken = typeof pollResult.boardApiToken === "string" && pollResult.boardApiToken.trim()
                ? pollResult.boardApiToken.trim()
                : typeof challenge.boardApiToken === "string" && challenge.boardApiToken.trim()
                    ? challenge.boardApiToken.trim()
                    : "";
            if (!boardApiToken) {
                throw new Error("Paperclip approved board access but did not return a usable API token.");
            }
            return boardApiToken;
        }
        if (status === "cancelled") {
            throw new Error("Board access approval was cancelled.");
        }
        if (status === "expired") {
            throw new Error("Board access approval expired. Start the connection flow again.");
        }
        if (Number.isFinite(expiresAtTimeMs) && Date.now() >= expiresAtTimeMs) {
            throw new Error("Board access approval expired. Start the connection flow again.");
        }
        await waitForDuration(pollIntervalMs);
    }
}
function getIdentityLabel(identity) {
    const candidates = [
        identity.user?.displayName,
        identity.user?.name,
        identity.user?.login,
        identity.user?.email,
        identity.displayName,
        identity.name,
        identity.login,
        identity.email,
    ];
    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
        }
    }
    return null;
}
async function fetchBoardAccessIdentity(boardApiToken) {
    const identity = await fetchHostJson("/api/cli-auth/me", {
        headers: {
            authorization: `Bearer ${boardApiToken.trim()}`,
        },
    });
    return getIdentityLabel(identity);
}
function pluginConfigPath(companyId) {
    const base = `/api/plugins/${encodeURIComponent(TELEGRAM_PLUGIN_ID)}/config`;
    const scopedCompanyId = companyId?.trim();
    return scopedCompanyId ? `${base}?companyId=${encodeURIComponent(scopedCompanyId)}` : base;
}
async function fetchPluginConfig(companyId) {
    const record = await fetchHostJson(pluginConfigPath(companyId));
    return record?.configJson && typeof record.configJson === "object" ? record.configJson : {};
}
async function fetchCompanySecrets(companyId) {
    return fetchHostJson(`/api/companies/${encodeURIComponent(companyId)}/secrets`);
}
const secretRefKeys = ["telegramBotTokenRef", "paperclipBoardApiTokenRef", "transcriptionApiKeyRef"];
function secretRefId(value) {
    return asString(value?.type === "secret_ref" ? value.secretId : value);
}
function encodeConfigSecretRefs(configJson) {
    const encoded = { ...configJson };
    for (const key of secretRefKeys) {
        const ref = encoded[key];
        if (typeof ref === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(ref.trim())) {
            encoded[key] = { type: "secret_ref", secretId: ref.trim() };
        }
    }
    return encoded;
}
async function savePluginConfig(configJson, companyId) {
    configJson = encodeConfigSecretRefs(configJson);
    const scopedCompanyId = companyId?.trim();
    await fetchHostJson(pluginConfigPath(), {
        method: "POST",
        body: JSON.stringify(scopedCompanyId ? { configJson, companyId: scopedCompanyId } : { configJson }),
    });
}
async function resolveOrCreateCompanySecret(companyId, name, value) {
    const existingSecrets = await fetchHostJson(`/api/companies/${encodeURIComponent(companyId)}/secrets`);
    const existing = existingSecrets.find((secret) => secret.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) {
        return fetchHostJson(`/api/secrets/${encodeURIComponent(existing.id)}/rotate`, {
            method: "POST",
            body: JSON.stringify({ value }),
        });
    }
    return fetchHostJson(`/api/companies/${encodeURIComponent(companyId)}/secrets`, {
        method: "POST",
        body: JSON.stringify({ name, value }),
    });
}
export function TelegramSettingsPage({ context }) {
    const boardAccess = usePluginData("board-access.read");
    const updateBoardAccess = usePluginAction("board-access.update");
    const [connecting, setConnecting] = useState(false);
    const [notice, setNotice] = useState(null);
    const [routingConfig, setRoutingConfig] = useState(DEFAULT_ROUTING_CONFIG);
    const [routingSnapshot, setRoutingSnapshot] = useState(DEFAULT_ROUTING_CONFIG);
    const [routingLoading, setRoutingLoading] = useState(true);
    const [routingSaving, setRoutingSaving] = useState(false);
    const [routingMessage, setRoutingMessage] = useState(null);
    const [connectionConfig, setConnectionConfig] = useState(DEFAULT_CONNECTION_CONFIG);
    const [connectionSnapshot, setConnectionSnapshot] = useState(DEFAULT_CONNECTION_CONFIG);
    const [connectionLoading, setConnectionLoading] = useState(true);
    const [connectionSaving, setConnectionSaving] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState(null);
    const [boardConfig, setBoardConfig] = useState(DEFAULT_BOARD_CONFIG);
    const [boardSnapshot, setBoardSnapshot] = useState(DEFAULT_BOARD_CONFIG);
    const [boardConfigLoading, setBoardConfigLoading] = useState(true);
    const [boardConfigSaving, setBoardConfigSaving] = useState(false);
    const [boardConfigMessage, setBoardConfigMessage] = useState(null);
    const [accessConfig, setAccessConfig] = useState(DEFAULT_ACCESS_CONFIG);
    const [accessSnapshot, setAccessSnapshot] = useState(DEFAULT_ACCESS_CONFIG);
    const [accessLoading, setAccessLoading] = useState(true);
    const [accessSaving, setAccessSaving] = useState(false);
    const [accessMessage, setAccessMessage] = useState(null);
    const [mediaConfig, setMediaConfig] = useState(DEFAULT_MEDIA_CONFIG);
    const [mediaSnapshot, setMediaSnapshot] = useState(DEFAULT_MEDIA_CONFIG);
    const [mediaLoading, setMediaLoading] = useState(true);
    const [mediaSaving, setMediaSaving] = useState(false);
    const [mediaMessage, setMediaMessage] = useState(null);
    const [escalationConfig, setEscalationConfig] = useState(DEFAULT_ESCALATION_CONFIG);
    const [escalationSnapshot, setEscalationSnapshot] = useState(DEFAULT_ESCALATION_CONFIG);
    const [escalationLoading, setEscalationLoading] = useState(true);
    const [escalationSaving, setEscalationSaving] = useState(false);
    const [escalationMessage, setEscalationMessage] = useState(null);
    const [proactiveConfig, setProactiveConfig] = useState(DEFAULT_PROACTIVE_CONFIG);
    const [proactiveSnapshot, setProactiveSnapshot] = useState(DEFAULT_PROACTIVE_CONFIG);
    const [proactiveLoading, setProactiveLoading] = useState(true);
    const [proactiveSaving, setProactiveSaving] = useState(false);
    const [proactiveMessage, setProactiveMessage] = useState(null);
    const companyId = context.companyId ?? "";
    const companyLabel = context.companyPrefix?.trim() || "this company";
    const configured = Boolean(boardAccess.data?.configured);
    const identity = boardAccess.data?.identity?.trim() || null;
    const routingDirty = JSON.stringify(routingConfig) !== JSON.stringify(routingSnapshot);
    const connectionDirty = JSON.stringify(connectionConfig) !== JSON.stringify(connectionSnapshot);
    const boardConfigDirty = JSON.stringify(boardConfig) !== JSON.stringify(boardSnapshot);
    const accessDirty = JSON.stringify(accessConfig) !== JSON.stringify(accessSnapshot);
    const mediaDirty = JSON.stringify(mediaConfig) !== JSON.stringify(mediaSnapshot);
    const escalationDirty = JSON.stringify(escalationConfig) !== JSON.stringify(escalationSnapshot);
    const proactiveDirty = JSON.stringify(proactiveConfig) !== JSON.stringify(proactiveSnapshot);
    useEffect(() => {
        let cancelled = false;
        async function loadRoutingConfig() {
            setRoutingLoading(true);
            setRoutingMessage(null);
            try {
                const config = await fetchPluginConfig(companyId);
                if (cancelled)
                    return;
                const nextRoutingConfig = extractRoutingConfig(config);
                setRoutingConfig(nextRoutingConfig);
                setRoutingSnapshot(nextRoutingConfig);
            }
            catch (error) {
                if (!cancelled) {
                    setRoutingMessage({
                        tone: "error",
                        title: "Routing settings could not be loaded",
                        text: getErrorMessage(error),
                    });
                }
            }
            finally {
                if (!cancelled) {
                    setRoutingLoading(false);
                }
            }
        }
        void loadRoutingConfig();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    useEffect(() => {
        let cancelled = false;
        async function loadProactiveConfig() {
            setProactiveLoading(true);
            setProactiveMessage(null);
            try {
                const config = await fetchPluginConfig(companyId);
                if (cancelled)
                    return;
                const nextProactiveConfig = extractProactiveConfig(config);
                setProactiveConfig(nextProactiveConfig);
                setProactiveSnapshot(nextProactiveConfig);
            }
            catch (error) {
                if (!cancelled) {
                    setProactiveMessage({
                        tone: "error",
                        title: "Proactive suggestion settings could not be loaded",
                        text: getErrorMessage(error),
                    });
                }
            }
            finally {
                if (!cancelled) {
                    setProactiveLoading(false);
                }
            }
        }
        void loadProactiveConfig();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    useEffect(() => {
        let cancelled = false;
        async function loadEscalationConfig() {
            setEscalationLoading(true);
            setEscalationMessage(null);
            try {
                const config = await fetchPluginConfig(companyId);
                if (cancelled)
                    return;
                const nextEscalationConfig = extractEscalationConfig(config);
                setEscalationConfig(nextEscalationConfig);
                setEscalationSnapshot(nextEscalationConfig);
            }
            catch (error) {
                if (!cancelled) {
                    setEscalationMessage({
                        tone: "error",
                        title: "Human escalation settings could not be loaded",
                        text: getErrorMessage(error),
                    });
                }
            }
            finally {
                if (!cancelled) {
                    setEscalationLoading(false);
                }
            }
        }
        void loadEscalationConfig();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    useEffect(() => {
        let cancelled = false;
        async function loadMediaConfig() {
            setMediaLoading(true);
            setMediaMessage(null);
            try {
                const config = await fetchPluginConfig(companyId);
                if (cancelled)
                    return;
                const nextMediaConfig = extractMediaConfig(config);
                setMediaConfig(nextMediaConfig);
                setMediaSnapshot(nextMediaConfig);
            }
            catch (error) {
                if (!cancelled) {
                    setMediaMessage({
                        tone: "error",
                        title: "Media intake settings could not be loaded",
                        text: getErrorMessage(error),
                    });
                }
            }
            finally {
                if (!cancelled) {
                    setMediaLoading(false);
                }
            }
        }
        void loadMediaConfig();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    useEffect(() => {
        let cancelled = false;
        async function loadAccessConfig() {
            setAccessLoading(true);
            setAccessMessage(null);
            try {
                const config = await fetchPluginConfig(companyId);
                if (cancelled)
                    return;
                const nextAccessConfig = extractAccessConfig(config);
                setAccessConfig(nextAccessConfig);
                setAccessSnapshot(nextAccessConfig);
            }
            catch (error) {
                if (!cancelled) {
                    setAccessMessage({
                        tone: "error",
                        title: "Access settings could not be loaded",
                        text: getErrorMessage(error),
                    });
                }
            }
            finally {
                if (!cancelled) {
                    setAccessLoading(false);
                }
            }
        }
        void loadAccessConfig();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    useEffect(() => {
        let cancelled = false;
        async function loadConnectionConfig() {
            setConnectionLoading(true);
            setConnectionMessage(null);
            try {
                const config = await fetchPluginConfig(companyId);
                if (cancelled)
                    return;
                const nextConnectionConfig = extractConnectionConfig(config);
                setConnectionConfig(nextConnectionConfig);
                setConnectionSnapshot(nextConnectionConfig);
            }
            catch (error) {
                if (!cancelled) {
                    setConnectionMessage({
                        tone: "error",
                        title: "Connection settings could not be loaded",
                        text: getErrorMessage(error),
                    });
                }
            }
            finally {
                if (!cancelled) {
                    setConnectionLoading(false);
                }
            }
        }
        void loadConnectionConfig();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    useEffect(() => {
        let cancelled = false;
        async function loadBoardConfig() {
            setBoardConfigLoading(true);
            setBoardConfigMessage(null);
            try {
                const config = await fetchPluginConfig(companyId);
                if (cancelled)
                    return;
                const nextBoardConfig = extractBoardConfig(config);
                setBoardConfig(nextBoardConfig);
                setBoardSnapshot(nextBoardConfig);
            }
            catch (error) {
                if (!cancelled) {
                    setBoardConfigMessage({
                        tone: "error",
                        title: "Board fallback setting could not be loaded",
                        text: getErrorMessage(error),
                    });
                }
            }
            finally {
                if (!cancelled) {
                    setBoardConfigLoading(false);
                }
            }
        }
        void loadBoardConfig();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    function updateRoutingField(key, value) {
        setRoutingConfig((current) => ({ ...current, [key]: value }));
        setRoutingMessage(null);
    }
    function updateBoardField(key, value) {
        setBoardConfig((current) => ({ ...current, [key]: value }));
        setBoardConfigMessage(null);
    }
    function updateAccessField(key, value) {
        setAccessConfig((current) => ({ ...current, [key]: value }));
        setAccessMessage(null);
    }
    function updateConnectionField(key, value) {
        setConnectionConfig((current) => ({ ...current, [key]: value }));
        setConnectionMessage(null);
    }
    function updateMediaField(key, value) {
        setMediaConfig((current) => ({ ...current, [key]: value }));
        setMediaMessage(null);
    }
    function updateEscalationField(key, value) {
        setEscalationConfig((current) => ({ ...current, [key]: value }));
        setEscalationMessage(null);
    }
    function updateProactiveField(key, value) {
        setProactiveConfig((current) => ({ ...current, [key]: value }));
        setProactiveMessage(null);
    }
    async function handleSaveBoardConfig() {
        setBoardConfigSaving(true);
        setBoardConfigMessage(null);
        try {
            const currentConfig = await fetchPluginConfig(companyId);
            const nextConfig = { ...currentConfig, ...boardConfig };
            await savePluginConfig(nextConfig, companyId);
            setBoardSnapshot(boardConfig);
            setBoardConfigMessage({
                tone: "success",
                title: "Board fallback saved",
                text: "The connection workflow remains preferred. This secret reference is used only as a manual fallback.",
            });
        }
        catch (error) {
            setBoardConfigMessage({
                tone: "error",
                title: "Board fallback could not be saved",
                text: getErrorMessage(error),
            });
        }
        finally {
            setBoardConfigSaving(false);
        }
    }
    async function handleSaveAccessConfig() {
        setAccessSaving(true);
        setAccessMessage(null);
        try {
            const currentConfig = await fetchPluginConfig(companyId);
            const nextConfig = { ...currentConfig, ...accessConfig };
            await savePluginConfig(nextConfig, companyId);
            setAccessSnapshot(accessConfig);
            setAccessMessage({
                tone: "success",
                title: "Bot access settings saved",
                text: "If the worker has already cached Telegram updates, restart the plugin if the new allowlist behavior is not picked up immediately.",
            });
        }
        catch (error) {
            setAccessMessage({
                tone: "error",
                title: "Bot access settings could not be saved",
                text: getErrorMessage(error),
            });
        }
        finally {
            setAccessSaving(false);
        }
    }
    async function handleSaveRoutingConfig() {
        setRoutingSaving(true);
        setRoutingMessage(null);
        try {
            const currentConfig = await fetchPluginConfig(companyId);
            const nextConfig = { ...currentConfig, ...routingConfig };
            await savePluginConfig(nextConfig, companyId);
            setRoutingSnapshot(routingConfig);
            setRoutingMessage({
                tone: "success",
                title: "Notification routing saved",
                text: "Refresh the page if another browser tab edited these settings at the same time.",
            });
        }
        catch (error) {
            setRoutingMessage({
                tone: "error",
                title: "Notification routing could not be saved",
                text: getErrorMessage(error),
            });
        }
        finally {
            setRoutingSaving(false);
        }
    }
    async function handleSaveConnectionConfig() {
        setConnectionSaving(true);
        setConnectionMessage(null);
        try {
            const currentConfig = await fetchPluginConfig(companyId);
            const nextConfig = { ...currentConfig, ...connectionConfig };
            await savePluginConfig(nextConfig, companyId);
            setConnectionSnapshot(connectionConfig);
            setConnectionMessage({
                tone: "success",
                title: "Connection settings saved",
                text: "These settings control the bot token and the Paperclip URLs used by Telegram messages and approval actions.",
            });
        }
        catch (error) {
            setConnectionMessage({
                tone: "error",
                title: "Connection settings could not be saved",
                text: getErrorMessage(error),
            });
        }
        finally {
            setConnectionSaving(false);
        }
    }
    async function handleSaveMediaConfig() {
        setMediaSaving(true);
        setMediaMessage(null);
        try {
            const currentConfig = await fetchPluginConfig(companyId);
            const nextConfig = { ...currentConfig, ...mediaConfig };
            await savePluginConfig(nextConfig, companyId);
            setMediaSnapshot(mediaConfig);
            setMediaMessage({
                tone: "success",
                title: "Media intake settings saved",
                text: "Media in configured intake chats is routed to the Brief Agent. Media in other chats can still go to active topic agent sessions.",
            });
        }
        catch (error) {
            setMediaMessage({
                tone: "error",
                title: "Media intake settings could not be saved",
                text: getErrorMessage(error),
            });
        }
        finally {
            setMediaSaving(false);
        }
    }
    async function handleSaveEscalationConfig() {
        setEscalationSaving(true);
        setEscalationMessage(null);
        try {
            const currentConfig = await fetchPluginConfig(companyId);
            const nextConfig = { ...currentConfig, ...escalationConfig };
            await savePluginConfig(nextConfig, companyId);
            setEscalationSnapshot(escalationConfig);
            setEscalationMessage({
                tone: "success",
                title: "Human escalation settings saved",
                text: "Escalations are sent to the configured Telegram chat when an agent invokes the human handoff tool.",
            });
        }
        catch (error) {
            setEscalationMessage({
                tone: "error",
                title: "Human escalation settings could not be saved",
                text: getErrorMessage(error),
            });
        }
        finally {
            setEscalationSaving(false);
        }
    }
    async function handleSaveProactiveConfig() {
        setProactiveSaving(true);
        setProactiveMessage(null);
        try {
            const currentConfig = await fetchPluginConfig(companyId);
            const nextConfig = { ...currentConfig, ...proactiveConfig };
            await savePluginConfig(nextConfig, companyId);
            setProactiveSnapshot(proactiveConfig);
            setProactiveMessage({
                tone: "success",
                title: "Proactive suggestion settings saved",
                text: "These limits apply when the scheduled watch job evaluates registered watches and sends Telegram suggestions.",
            });
        }
        catch (error) {
            setProactiveMessage({
                tone: "error",
                title: "Proactive suggestion settings could not be saved",
                text: getErrorMessage(error),
            });
        }
        finally {
            setProactiveSaving(false);
        }
    }
    async function handleConnectBoardAccess() {
        if (!companyId) {
            setNotice({
                tone: "error",
                title: "Open company settings first",
                text: "Board access tokens are saved as company secrets, so this flow needs a company context.",
            });
            return;
        }
        setConnecting(true);
        setNotice(null);
        let approvalWindow = null;
        try {
            if (typeof window !== "undefined") {
                approvalWindow = window.open("about:blank", "_blank");
            }
            const challenge = await requestBoardAccessChallenge(companyId);
            const approvalUrl = resolveCliAuthUrl(challenge.approvalUrl, challenge.approvalPath);
            if (!approvalUrl) {
                throw new Error("Paperclip did not return a trusted board approval URL.");
            }
            if (!approvalWindow && typeof window !== "undefined") {
                approvalWindow = window.open(approvalUrl, "_blank");
            }
            else {
                approvalWindow?.location.replace(approvalUrl);
            }
            if (!approvalWindow) {
                throw new Error("Allow pop-ups for Paperclip, then try connecting board access again.");
            }
            const boardApiToken = await waitForBoardAccessApproval(challenge);
            const nextIdentity = await fetchBoardAccessIdentity(boardApiToken);
            const secretName = `telegram_board_api_${companyId.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`;
            const secret = await resolveOrCreateCompanySecret(companyId, secretName, boardApiToken);
            const currentConfig = await fetchPluginConfig(companyId);
            await savePluginConfig({ ...currentConfig, paperclipBoardApiTokenRef: secret.id }, companyId);
            await updateBoardAccess({
                companyId,
                paperclipBoardApiTokenRef: secret.id,
                identity: nextIdentity,
            });
            await boardAccess.refresh();
            setNotice({
                tone: "success",
                title: nextIdentity ? `Connected as ${nextIdentity}` : "Board access connected",
                text: "Telegram approval actions can now authenticate with Paperclip.",
            });
        }
        catch (error) {
            setNotice({
                tone: "error",
                title: "Board access could not be connected",
                text: getErrorMessage(error),
            });
        }
        finally {
            setConnecting(false);
            try {
                approvalWindow?.close();
            }
            catch {
                // Ignore browser close restrictions.
            }
        }
    }
    return (_jsxs("main", { style: { display: "grid", gap: 24, padding: 24, color: "#111827" }, children: [_jsxs("section", { style: { display: "grid", gap: 8 }, children: [_jsx("h1", { style: { fontSize: 24, lineHeight: "32px", margin: 0 }, children: "Telegram Bot" }), _jsx("p", { style: { color: "#6b7280", margin: 0, maxWidth: 760 }, children: "Configure Telegram connection, access control, notification routing, media intake, escalation, and proactive suggestion behavior." })] }), notice ? (_jsxs("div", { style: {
                    border: `1px solid ${notice.tone === "success" ? "#99f6e4" : "#fecaca"}`,
                    borderRadius: 8,
                    background: notice.tone === "success" ? "#f0fdfa" : "#fef2f2",
                    color: notice.tone === "success" ? "#115e59" : "#991b1b",
                    padding: 14,
                }, children: [_jsx("strong", { children: notice.title }), notice.text ? _jsx("p", { style: { margin: "6px 0 0" }, children: notice.text }) : null] })) : null, _jsxs("section", { style: {
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    display: "grid",
                    gap: 18,
                    padding: 18,
                }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 700, lineHeight: "28px", margin: 0 }, children: "Connection & URLs" }), _jsx("p", { style: { color: "#6b7280", margin: 0 }, children: "Core connection values used by the Telegram worker. Select company secrets for sensitive values; secret values are never shown here." })] }), _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsx(SecretRefField, { companyId: companyId, disabled: connectionLoading || connectionSaving, label: "Telegram bot token secret ref", onChange: (value) => updateConnectionField("telegramBotTokenRef", value), placeholder: "Secret UUID fallback", value: connectionConfig.telegramBotTokenRef, children: "Select the company secret that stores your Telegram bot token from @BotFather. The plugin resolves this secret before polling Telegram." }), _jsx(TextField, { disabled: connectionLoading || connectionSaving, label: "Paperclip API URL", onChange: (value) => updateConnectionField("paperclipBaseUrl", value), placeholder: "http://localhost:3100", value: connectionConfig.paperclipBaseUrl, children: "Internal Paperclip API URL used by the plugin for actions such as approvals and comments. Keep localhost for same-server deployments." }), _jsx(TextField, { disabled: connectionLoading || connectionSaving, label: "Paperclip public URL", onChange: (value) => updateConnectionField("paperclipPublicUrl", value), placeholder: "https://paperclip.example.com", value: connectionConfig.paperclipPublicUrl, children: "Public URL used in Telegram links. Leave empty to fall back to the API URL." })] }), connectionMessage ? _jsx(NoticeBlock, { notice: connectionMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" }, children: [_jsx("button", { disabled: connectionLoading || connectionSaving, onClick: () => {
                                    setConnectionConfig(connectionSnapshot);
                                    setConnectionMessage(null);
                                }, style: {
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    color: "#374151",
                                    cursor: connectionLoading || connectionSaving ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    padding: "10px 14px",
                                }, type: "button", children: "Reset" }), _jsx("button", { disabled: connectionLoading || connectionSaving || !connectionDirty, onClick: () => {
                                    void handleSaveConnectionConfig();
                                }, style: {
                                    background: connectionLoading || connectionSaving || !connectionDirty ? "#9ca3af" : "#111827",
                                    border: 0,
                                    borderRadius: 8,
                                    color: "white",
                                    cursor: connectionLoading || connectionSaving || !connectionDirty ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    minWidth: 160,
                                    padding: "10px 14px",
                                }, type: "button", children: connectionSaving ? "Saving..." : "Save connection" })] })] }), _jsxs("section", { style: {
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    display: "grid",
                    gap: 18,
                    padding: 18,
                }, children: [_jsxs("div", { style: { alignItems: "start", display: "flex", gap: 16, justifyContent: "space-between" }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 700, lineHeight: "28px", margin: 0 }, children: "Board Access Connection" }), _jsx("p", { style: { color: "#6b7280", margin: 0 }, children: "Telegram approval buttons need board access when Paperclip requires authenticated approval mutations." })] }), _jsx("span", { style: {
                                    background: configured ? "#ccfbf1" : "#f3f4f6",
                                    borderRadius: 999,
                                    color: configured ? "#0f766e" : "#4b5563",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: "5px 10px",
                                    whiteSpace: "nowrap",
                                }, children: connecting ? "Connecting" : configured ? "Connected" : "Not connected" })] }), _jsxs("div", { style: {
                            alignItems: "center",
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            display: "flex",
                            gap: 16,
                            justifyContent: "space-between",
                            padding: 14,
                        }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("strong", { children: !companyId
                                            ? "Open this page inside a company"
                                            : configured
                                                ? identity
                                                    ? `Connected as ${identity}`
                                                    : `Connected for ${companyLabel}`
                                                : `Connect board access for ${companyLabel}` }), _jsx("span", { style: { color: "#6b7280" }, children: configured
                                            ? "The board token is stored as a Paperclip secret; the plugin keeps only the secret reference."
                                            : "This opens a Paperclip approval page, then saves the resulting board token as a company secret." })] }), _jsx("button", { disabled: !companyId || connecting || boardAccess.loading, onClick: () => {
                                    void handleConnectBoardAccess();
                                }, style: {
                                    background: !companyId || connecting || boardAccess.loading ? "#9ca3af" : "#111827",
                                    border: 0,
                                    borderRadius: 8,
                                    color: "white",
                                    cursor: !companyId || connecting || boardAccess.loading ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    minWidth: 190,
                                    padding: "10px 14px",
                                }, type: "button", children: connecting ? "Waiting for approval..." : configured ? "Reconnect board access" : "Connect board access" })] }), _jsxs("div", { style: { borderTop: "1px solid #e5e7eb", display: "grid", gap: 12, paddingTop: 14 }, children: [_jsx(SecretRefField, { companyId: companyId, disabled: boardConfigLoading || boardConfigSaving, label: "Board API token secret ref fallback", onChange: (value) => updateBoardField("paperclipBoardApiTokenRef", value), placeholder: "Optional secret UUID fallback", value: boardConfig.paperclipBoardApiTokenRef, children: "Optional manual fallback for approval buttons and /approve. The Board Access Connection above is preferred because it creates and tracks the company-scoped secret for you." }), boardConfigMessage ? _jsx(NoticeBlock, { notice: boardConfigMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" }, children: [_jsx("button", { disabled: boardConfigLoading || boardConfigSaving, onClick: () => {
                                            setBoardConfig(boardSnapshot);
                                            setBoardConfigMessage(null);
                                        }, style: {
                                            background: "white",
                                            border: "1px solid #d1d5db",
                                            borderRadius: 8,
                                            color: "#374151",
                                            cursor: boardConfigLoading || boardConfigSaving ? "not-allowed" : "pointer",
                                            fontWeight: 700,
                                            padding: "10px 14px",
                                        }, type: "button", children: "Reset" }), _jsx("button", { disabled: boardConfigLoading || boardConfigSaving || !boardConfigDirty, onClick: () => {
                                            void handleSaveBoardConfig();
                                        }, style: {
                                            background: boardConfigLoading || boardConfigSaving || !boardConfigDirty ? "#9ca3af" : "#111827",
                                            border: 0,
                                            borderRadius: 8,
                                            color: "white",
                                            cursor: boardConfigLoading || boardConfigSaving || !boardConfigDirty ? "not-allowed" : "pointer",
                                            fontWeight: 700,
                                            minWidth: 160,
                                            padding: "10px 14px",
                                        }, type: "button", children: boardConfigSaving ? "Saving..." : "Save fallback" })] })] }), boardAccess.error ? (_jsxs("p", { style: { color: "#991b1b", margin: 0 }, children: ["Could not read board access state: ", boardAccess.error.message] })) : null] }), _jsxs("section", { style: {
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    display: "grid",
                    gap: 18,
                    padding: 18,
                }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 700, lineHeight: "28px", margin: 0 }, children: "Bot Interaction & Access Control" }), _jsx("p", { style: { color: "#6b7280", margin: 0 }, children: "Controls who can use the bot interactively. Empty allowlists are permissive; set both user and chat IDs for strict private-group access." })] }), _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsx(CheckboxField, { checked: accessConfig.enableCommands, disabled: accessLoading || accessSaving, label: "Enable bot commands", onChange: (value) => updateAccessField("enableCommands", value), children: "Allow Telegram users to run commands such as /status, /issues, and /agents. Use allowlists when commands are enabled." }), _jsx(CheckboxField, { checked: accessConfig.enableInbound, disabled: accessLoading || accessSaving, label: "Enable inbound replies", onChange: (value) => updateAccessField("enableInbound", value), children: "Route Telegram replies to Paperclip issue comments when a message replies to a bot notification. Use allowlists when inbound replies are enabled." }), _jsx(ArrayField, { disabled: accessLoading || accessSaving, emptyValueLabel: "No user IDs configured", label: "Allowed Telegram user IDs", newItemLabel: "Add user ID", onChange: (value) => updateAccessField("allowedTelegramUserIds", value), placeholder: "6395513943", value: accessConfig.allowedTelegramUserIds, children: "Optional. One Telegram user ID per line. Leave empty to allow any user. Applies to commands, inbound replies, media intake, and button callbacks." }), _jsx(ArrayField, { disabled: accessLoading || accessSaving, emptyValueLabel: "No chat IDs configured", label: "Allowed Telegram chat IDs", newItemLabel: "Add chat ID", onChange: (value) => updateAccessField("allowedTelegramChatIds", value), placeholder: "-1003800613668", value: accessConfig.allowedTelegramChatIds, children: "Optional. One chat ID per line. Use private DM IDs and/or private group IDs. If both user and chat allowlists are set, both must match." })] }), accessMessage ? _jsx(NoticeBlock, { notice: accessMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" }, children: [_jsx("button", { disabled: accessLoading || accessSaving, onClick: () => {
                                    setAccessConfig(accessSnapshot);
                                    setAccessMessage(null);
                                }, style: {
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    color: "#374151",
                                    cursor: accessLoading || accessSaving ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    padding: "10px 14px",
                                }, type: "button", children: "Reset" }), _jsx("button", { disabled: accessLoading || accessSaving || !accessDirty, onClick: () => {
                                    void handleSaveAccessConfig();
                                }, style: {
                                    background: accessLoading || accessSaving || !accessDirty ? "#9ca3af" : "#111827",
                                    border: 0,
                                    borderRadius: 8,
                                    color: "white",
                                    cursor: accessLoading || accessSaving || !accessDirty ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    minWidth: 160,
                                    padding: "10px 14px",
                                }, type: "button", children: accessSaving ? "Saving..." : "Save access" })] })] }), _jsxs("section", { style: {
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    display: "grid",
                    gap: 18,
                    padding: 18,
                }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 700, lineHeight: "28px", margin: 0 }, children: "Notification Routing & Forum Topics" }), _jsx("p", { style: { color: "#6b7280", margin: 0 }, children: "Grouped operational destinations. Empty Chat IDs fall back to the default route; Topic IDs are optional and only apply inside the matching Telegram forum group." })] }), _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsxs("section", { style: {
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 8,
                                    display: "grid",
                                    gap: 10,
                                    padding: 12,
                                }, children: [_jsx("strong", { children: "Default route" }), _jsxs("label", { style: { display: "grid", gap: 5 }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Fallback Chat ID" }), _jsx("input", { disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("defaultChatId", event.currentTarget.value), placeholder: "Default chat ID", style: {
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: 8,
                                                    fontSize: 14,
                                                    minWidth: 0,
                                                    padding: "9px 10px",
                                                }, type: "text", value: routingConfig.defaultChatId }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: "Used when a notification type leaves its Chat ID empty and no company-specific chat is connected." })] }), _jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.topicRouting, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("topicRouting", event.currentTarget.checked), type: "checkbox" }), "Forum topic routing"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Route project-linked notifications to Telegram forum topics mapped with /connect_topic." })] }), _jsxs("label", { style: { display: "grid", gap: 5 }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Max agents per forum topic" }), _jsx("input", { disabled: routingLoading || routingSaving, min: 1, onChange: (event) => updateRoutingField("maxAgentsPerThread", Number(event.currentTarget.value)), placeholder: "3", style: {
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: 8,
                                                    fontSize: 14,
                                                    maxWidth: 180,
                                                    minWidth: 0,
                                                    padding: "9px 10px",
                                                }, type: "number", value: routingConfig.maxAgentsPerThread }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: "Maximum concurrent agent sessions allowed inside one Telegram forum topic. This applies to /acp agent sessions, not notification delivery." })] })] }), _jsxs("section", { style: {
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 8,
                                    display: "grid",
                                    gap: 10,
                                    padding: 12,
                                }, children: [_jsx("strong", { children: "Issues" }), _jsxs("div", { style: { display: "grid", gap: 10 }, children: [_jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.notifyOnIssueCreated, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("notifyOnIssueCreated", event.currentTarget.checked), type: "checkbox" }), "Created"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Send a Telegram notification when a new issue is created." })] }), _jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.notifyOnIssueDone, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("notifyOnIssueDone", event.currentTarget.checked), type: "checkbox" }), "Completed"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Send a Telegram notification when an issue is completed." })] }), _jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.notifyOnIssueAssigned, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("notifyOnIssueAssigned", event.currentTarget.checked), type: "checkbox" }), "Assignment changes"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Send a Telegram notification when an issue assignee changes." })] })] }), _jsxs("label", { style: { display: "grid", gap: 5 }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Only when assigned to user ID" }), _jsx("input", { disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("onlyNotifyIfAssignedTo", event.currentTarget.value), placeholder: "Paperclip user ID", style: {
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: 8,
                                                    fontSize: 14,
                                                    minWidth: 0,
                                                    padding: "9px 10px",
                                                }, type: "text", value: routingConfig.onlyNotifyIfAssignedTo }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: "Optional. Restricts assignment-change notifications to issues assigned to this Paperclip user." })] })] }), _jsx(RoutingRow, { title: "Approvals", chatId: routingConfig.approvalsChatId, topicId: routingConfig.approvalsTopicId, chatPlaceholder: "Approvals chat ID", topicPlaceholder: "Approvals topic ID", disabled: routingLoading || routingSaving, onChatIdChange: (value) => updateRoutingField("approvalsChatId", value), onTopicIdChange: (value) => updateRoutingField("approvalsTopicId", value), chatHelp: "Leave empty to use the default route for approval notifications.", footer: _jsxs(_Fragment, { children: [_jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.notifyOnApprovalCreated, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("notifyOnApprovalCreated", event.currentTarget.checked), type: "checkbox" }), "Enabled"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Send Telegram notifications when approval requests are created." })] }), _jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.onlyNotifyBoardApprovals, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("onlyNotifyBoardApprovals", event.currentTarget.checked), type: "checkbox" }), "Board requests only"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Ignore internal approvals and notify only when an agent requests Board approval." })] })] }) }), _jsx(RoutingRow, { title: "Errors", chatId: routingConfig.errorsChatId, topicId: routingConfig.errorsTopicId, chatPlaceholder: "Errors chat ID", topicPlaceholder: "Errors topic ID", disabled: routingLoading || routingSaving, onChatIdChange: (value) => updateRoutingField("errorsChatId", value), onTopicIdChange: (value) => updateRoutingField("errorsTopicId", value), chatHelp: "Leave empty to use the default route for agent error notifications.", footer: _jsxs(_Fragment, { children: [_jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.notifyOnAgentError, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("notifyOnAgentError", event.currentTarget.checked), type: "checkbox" }), "Errors enabled"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Send Telegram notifications when an agent run reports an error." })] }), _jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.notifyOnAgentRunStarted, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("notifyOnAgentRunStarted", event.currentTarget.checked), type: "checkbox" }), "Run started"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Notify on every agent run start. Off by default - high-frequency on busy instances. Routes through the default chat." })] }), _jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: routingConfig.notifyOnAgentRunFinished, disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("notifyOnAgentRunFinished", event.currentTarget.checked), type: "checkbox" }), "Run finished"] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: "Notify on every agent run completion. Off by default - high-frequency on busy instances. Routes through the default chat." })] })] }) }), _jsx(RoutingRow, { title: "Digests", chatId: routingConfig.digestChatId, topicId: routingConfig.digestTopicId, chatPlaceholder: "Digest chat ID", topicPlaceholder: "Digest topic ID", disabled: routingLoading || routingSaving, onChatIdChange: (value) => updateRoutingField("digestChatId", value), onTopicIdChange: (value) => updateRoutingField("digestTopicId", value), chatHelp: "Leave empty to use the company/default route for digest notifications.", footer: _jsxs("div", { style: { display: "grid", gap: 10 }, children: [_jsxs("label", { style: { display: "grid", gap: 6 }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Mode" }), _jsxs("select", { disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("digestMode", event.currentTarget.value), style: {
                                                        border: "1px solid #d1d5db",
                                                        borderRadius: 8,
                                                        fontSize: 14,
                                                        maxWidth: 280,
                                                        padding: "9px 10px",
                                                    }, value: routingConfig.digestMode, children: [_jsx("option", { value: "off", children: "Off" }), _jsx("option", { value: "daily", children: "Daily" }), _jsx("option", { value: "bidaily", children: "Bidaily" }), _jsx("option", { value: "tridaily", children: "Tridaily" })] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: "Off disables digest notifications. Times are UTC." })] }), _jsxs("div", { style: { alignItems: "stretch", display: "grid", gap: 10, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }, children: [_jsxs("label", { style: { display: "grid", gap: 5, gridTemplateRows: "auto auto minmax(32px, auto)" }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Daily time" }), _jsx("input", { disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("dailyDigestTime", event.currentTarget.value), placeholder: "09:00", style: {
                                                                border: "1px solid #d1d5db",
                                                                borderRadius: 8,
                                                                fontSize: 14,
                                                                minWidth: 0,
                                                                padding: "9px 10px",
                                                            }, type: "text", value: routingConfig.dailyDigestTime }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, lineHeight: "16px" }, children: "Used for daily mode and as the first bidaily slot." })] }), _jsxs("label", { style: { display: "grid", gap: 5, gridTemplateRows: "auto auto minmax(32px, auto)" }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Bidaily second time" }), _jsx("input", { disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("bidailySecondTime", event.currentTarget.value), placeholder: "17:00", style: {
                                                                border: "1px solid #d1d5db",
                                                                borderRadius: 8,
                                                                fontSize: 14,
                                                                minWidth: 0,
                                                                padding: "9px 10px",
                                                            }, type: "text", value: routingConfig.bidailySecondTime }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, lineHeight: "16px" }, children: "Second send time when bidaily mode is selected." })] }), _jsxs("label", { style: { display: "grid", gap: 5, gridTemplateRows: "auto auto minmax(32px, auto)" }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Tridaily times" }), _jsx("input", { disabled: routingLoading || routingSaving, onChange: (event) => updateRoutingField("tridailyTimes", event.currentTarget.value), placeholder: "07:00,13:00,19:00", style: {
                                                                border: "1px solid #d1d5db",
                                                                borderRadius: 8,
                                                                fontSize: 14,
                                                                minWidth: 0,
                                                                padding: "9px 10px",
                                                            }, type: "text", value: routingConfig.tridailyTimes }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, lineHeight: "16px" }, children: "Three comma-separated UTC times for tridaily mode." })] })] })] }) })] }), routingMessage ? _jsx(NoticeBlock, { notice: routingMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" }, children: [_jsx("button", { disabled: routingLoading || routingSaving, onClick: () => {
                                    setRoutingConfig(routingSnapshot);
                                    setRoutingMessage(null);
                                }, style: {
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    color: "#374151",
                                    cursor: routingLoading || routingSaving ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    padding: "10px 14px",
                                }, type: "button", children: "Reset" }), _jsx("button", { disabled: routingLoading || routingSaving || !routingDirty, onClick: () => {
                                    void handleSaveRoutingConfig();
                                }, style: {
                                    background: routingLoading || routingSaving || !routingDirty ? "#9ca3af" : "#111827",
                                    border: 0,
                                    borderRadius: 8,
                                    color: "white",
                                    cursor: routingLoading || routingSaving || !routingDirty ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    minWidth: 160,
                                    padding: "10px 14px",
                                }, type: "button", children: routingSaving ? "Saving..." : "Save routing" })] })] }), _jsxs("section", { style: {
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    display: "grid",
                    gap: 18,
                    padding: 18,
                }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 700, lineHeight: "28px", margin: 0 }, children: "Media Intake / Brief Agent" }), _jsx("p", { style: { color: "#6b7280", margin: 0 }, children: "Routes Telegram voice, audio, documents, and photos either to a Brief Agent intake flow or to active agent sessions inside forum topics." })] }), _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsx(SecretRefField, { companyId: companyId, disabled: mediaLoading || mediaSaving, label: "OpenAI transcription secret", onChange: (value) => updateMediaField("transcriptionApiKeyRef", value), placeholder: "OpenAI API key secret UUID fallback", value: mediaConfig.transcriptionApiKeyRef, children: "Select the company secret used for audio transcription. Secret values are never shown to the plugin UI." }), _jsx(TextField, { disabled: mediaLoading || mediaSaving, label: "Brief Agent ID", onChange: (value) => updateMediaField("briefAgentId", value), placeholder: "Paperclip agent ID", value: mediaConfig.briefAgentId, children: "Agent ID that processes media intake briefs. Leave empty to disable the dedicated Brief Agent intake flow." }), _jsx(ArrayField, { disabled: mediaLoading || mediaSaving, emptyValueLabel: "No intake chat IDs configured", label: "Brief Agent intake chat IDs", newItemLabel: "Add intake chat ID", onChange: (value) => updateMediaField("briefAgentChatIds", value), placeholder: "-1003800613668", value: mediaConfig.briefAgentChatIds, children: "Telegram chat IDs where media is routed to the Brief Agent. Media in other chats goes to active agent sessions when a matching forum topic session exists." })] }), mediaMessage ? _jsx(NoticeBlock, { notice: mediaMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" }, children: [_jsx("button", { disabled: mediaLoading || mediaSaving, onClick: () => {
                                    setMediaConfig(mediaSnapshot);
                                    setMediaMessage(null);
                                }, style: {
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    color: "#374151",
                                    cursor: mediaLoading || mediaSaving ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    padding: "10px 14px",
                                }, type: "button", children: "Reset" }), _jsx("button", { disabled: mediaLoading || mediaSaving || !mediaDirty, onClick: () => {
                                    void handleSaveMediaConfig();
                                }, style: {
                                    background: mediaLoading || mediaSaving || !mediaDirty ? "#9ca3af" : "#111827",
                                    border: 0,
                                    borderRadius: 8,
                                    color: "white",
                                    cursor: mediaLoading || mediaSaving || !mediaDirty ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    minWidth: 160,
                                    padding: "10px 14px",
                                }, type: "button", children: mediaSaving ? "Saving..." : "Save media intake" })] })] }), _jsxs("section", { style: {
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    display: "grid",
                    gap: 18,
                    padding: 18,
                }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 700, lineHeight: "28px", margin: 0 }, children: "Human Escalation" }), _jsx("p", { style: { color: "#6b7280", margin: 0 }, children: "Controls where human handoff requests go and what the bot tells the original Telegram user while waiting." })] }), _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsx(TextField, { disabled: escalationLoading || escalationSaving, label: "Escalation Chat ID", onChange: (value) => updateEscalationField("escalationChatId", value), placeholder: "-1003800613668", value: escalationConfig.escalationChatId, children: "Telegram chat ID where escalations are sent for human review. Leave empty to log escalations without forwarding them to Telegram." }), _jsxs("div", { style: twoColumnGridStyle, children: [_jsxs("label", { style: pairedFieldStyle, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Escalation timeout (ms)" }), _jsx("input", { disabled: escalationLoading || escalationSaving, min: 0, onChange: (event) => updateEscalationField("escalationTimeoutMs", Number(event.currentTarget.value)), placeholder: "900000", style: standardInputStyle, type: "number", value: escalationConfig.escalationTimeoutMs }), _jsx("span", { style: helperTextStyle, children: "How long to wait for a human response. Default is 900000 ms, or 15 minutes." })] }), _jsxs("label", { style: pairedFieldStyle, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Default action on timeout" }), _jsxs("select", { disabled: escalationLoading || escalationSaving, onChange: (event) => updateEscalationField("escalationDefaultAction", event.currentTarget.value), style: standardInputStyle, value: escalationConfig.escalationDefaultAction, children: [_jsx("option", { value: "defer", children: "Defer" }), _jsx("option", { value: "auto_reply", children: "Auto reply" }), _jsx("option", { value: "close", children: "Close" })] }), _jsx("span", { style: helperTextStyle, children: "Defer does nothing, auto reply sends the suggested reply, and close ends the escalation path." })] })] }), _jsx(TextAreaField, { disabled: escalationLoading || escalationSaving, label: "Hold message", onChange: (value) => updateEscalationField("escalationHoldMessage", value), placeholder: "Let me check on that - I'll get back to you shortly.", rows: 3, value: escalationConfig.escalationHoldMessage, children: "Message sent to the original Telegram user when their conversation is escalated to a human." })] }), escalationMessage ? _jsx(NoticeBlock, { notice: escalationMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" }, children: [_jsx("button", { disabled: escalationLoading || escalationSaving, onClick: () => {
                                    setEscalationConfig(escalationSnapshot);
                                    setEscalationMessage(null);
                                }, style: {
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    color: "#374151",
                                    cursor: escalationLoading || escalationSaving ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    padding: "10px 14px",
                                }, type: "button", children: "Reset" }), _jsx("button", { disabled: escalationLoading || escalationSaving || !escalationDirty, onClick: () => {
                                    void handleSaveEscalationConfig();
                                }, style: {
                                    background: escalationLoading || escalationSaving || !escalationDirty ? "#9ca3af" : "#111827",
                                    border: 0,
                                    borderRadius: 8,
                                    color: "white",
                                    cursor: escalationLoading || escalationSaving || !escalationDirty ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    minWidth: 160,
                                    padding: "10px 14px",
                                }, type: "button", children: escalationSaving ? "Saving..." : "Save escalation" })] })] }), _jsxs("section", { style: {
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    display: "grid",
                    gap: 18,
                    padding: 18,
                }, children: [_jsxs("div", { style: { display: "grid", gap: 4 }, children: [_jsx("h2", { style: { fontSize: 18, fontWeight: 700, lineHeight: "28px", margin: 0 }, children: "Proactive Suggestions" }), _jsx("p", { style: { color: "#6b7280", margin: 0 }, children: "Controls the scheduled watch system that sends Telegram suggestions when registered watches match Paperclip activity." })] }), _jsxs("div", { style: twoColumnGridStyle, children: [_jsxs("label", { style: pairedFieldStyle, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Suggestion rate limit" }), _jsx("input", { disabled: proactiveLoading || proactiveSaving, min: 0, onChange: (event) => updateProactiveField("maxSuggestionsPerHourPerCompany", Number(event.currentTarget.value)), placeholder: "10", style: standardInputStyle, type: "number", value: proactiveConfig.maxSuggestionsPerHourPerCompany }), _jsx("span", { style: helperTextStyle, children: "Maximum proactive suggestions sent per company per hour. Set to 0 to suppress watch suggestions without deleting watches." })] }), _jsxs("label", { style: pairedFieldStyle, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Watch deduplication window (ms)" }), _jsx("input", { disabled: proactiveLoading || proactiveSaving, min: 0, onChange: (event) => updateProactiveField("watchDeduplicationWindowMs", Number(event.currentTarget.value)), placeholder: "86400000", style: standardInputStyle, type: "number", value: proactiveConfig.watchDeduplicationWindowMs }), _jsx("span", { style: helperTextStyle, children: "Suppresses repeat suggestions for the same watch/entity pair within this window. Default is 86400000 ms, or 24 hours." })] })] }), _jsxs("div", { style: {
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            color: "#4b5563",
                            display: "grid",
                            fontSize: 13,
                            gap: 4,
                            padding: 12,
                        }, children: [_jsx("strong", { style: { color: "#374151" }, children: "Watch controls" }), _jsx("span", { children: "Individual watches are created by agents through the `register_watch` tool and stored per company. This section controls global rate limiting and duplicate suppression; it does not create or delete watch definitions." })] }), proactiveMessage ? _jsx(NoticeBlock, { notice: proactiveMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" }, children: [_jsx("button", { disabled: proactiveLoading || proactiveSaving, onClick: () => {
                                    setProactiveConfig(proactiveSnapshot);
                                    setProactiveMessage(null);
                                }, style: {
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    color: "#374151",
                                    cursor: proactiveLoading || proactiveSaving ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    padding: "10px 14px",
                                }, type: "button", children: "Reset" }), _jsx("button", { disabled: proactiveLoading || proactiveSaving || !proactiveDirty, onClick: () => {
                                    void handleSaveProactiveConfig();
                                }, style: {
                                    background: proactiveLoading || proactiveSaving || !proactiveDirty ? "#9ca3af" : "#111827",
                                    border: 0,
                                    borderRadius: 8,
                                    color: "white",
                                    cursor: proactiveLoading || proactiveSaving || !proactiveDirty ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    minWidth: 160,
                                    padding: "10px 14px",
                                }, type: "button", children: proactiveSaving ? "Saving..." : "Save suggestions" })] })] })] }));
}
function NoticeBlock({ notice }) {
    return (_jsxs("div", { style: {
            border: `1px solid ${notice.tone === "success" ? "#99f6e4" : "#fecaca"}`,
            borderRadius: 8,
            background: notice.tone === "success" ? "#f0fdfa" : "#fef2f2",
            color: notice.tone === "success" ? "#115e59" : "#991b1b",
            padding: 12,
        }, children: [_jsx("strong", { children: notice.title }), notice.text ? _jsx("p", { style: { margin: "6px 0 0" }, children: notice.text }) : null] }));
}
function SecretRefField({ label, value, placeholder, disabled, companyId, children, onChange, }) {
    const [secrets, setSecrets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        async function loadSecrets() {
            if (!companyId) {
                setSecrets([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const nextSecrets = await fetchCompanySecrets(companyId);
                if (!cancelled) {
                    setSecrets(nextSecrets.filter((secret) => secret.status !== "deleted"));
                }
            }
            catch (err) {
                if (!cancelled) {
                    setError(getErrorMessage(err));
                }
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }
        void loadSecrets();
        return () => {
            cancelled = true;
        };
    }, [companyId]);
    const selectedValue = secrets.some((secret) => secret.id === value) ? value : "";
    const fieldDisabled = disabled || loading || !companyId;
    return (_jsxs("label", { style: { display: "grid", gap: 5 }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: label }), _jsxs("select", { disabled: fieldDisabled, onChange: (event) => onChange(event.currentTarget.value), style: standardInputStyle, value: selectedValue, children: [_jsx("option", { value: "", children: !companyId
                            ? "Open inside a company to select a secret"
                            : loading
                                ? "Loading company secrets..."
                                : value && !selectedValue
                                    ? "Manual UUID selected"
                                    : "Select a company secret" }), secrets.map((secret) => (_jsxs("option", { value: secret.id, children: [secret.name || secret.key || secret.id, secret.key && secret.key !== secret.name ? ` (${secret.key})` : "", secret.latestVersion ? ` · v${secret.latestVersion}` : ""] }, secret.id)))] }), _jsx("input", { disabled: disabled, onChange: (event) => onChange(event.currentTarget.value), placeholder: placeholder, style: standardInputStyle, type: "text", value: value }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: children }), error ? _jsxs("span", { style: { color: "#b91c1c", fontSize: 12 }, children: ["Could not load company secrets: ", error] }) : null] }));
}
function TextField({ label, value, placeholder, disabled, children, onChange, }) {
    return (_jsxs("label", { style: { display: "grid", gap: 5 }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: label }), _jsx("input", { disabled: disabled, onChange: (event) => onChange(event.currentTarget.value), placeholder: placeholder, style: {
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    minWidth: 0,
                    padding: "9px 10px",
                }, type: "text", value: value }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: children })] }));
}
function TextAreaField({ label, value, placeholder, rows = 3, disabled, children, onChange, }) {
    return (_jsxs("label", { style: { display: "grid", gap: 5 }, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: label }), _jsx("textarea", { disabled: disabled, onChange: (event) => onChange(event.currentTarget.value), placeholder: placeholder, rows: rows, style: {
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    minWidth: 0,
                    padding: "9px 10px",
                    resize: "vertical",
                }, value: value }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: children })] }));
}
function ArrayField({ label, value, placeholder, disabled, emptyValueLabel, newItemLabel, children, onChange, }) {
    function updateItem(index, nextValue) {
        const next = [...value];
        next[index] = nextValue;
        onChange(next);
    }
    function removeItem(index) {
        onChange(value.filter((_, itemIndex) => itemIndex !== index));
    }
    function addItem() {
        onChange([...value, ""]);
    }
    return (_jsxs("div", { style: { display: "grid", gap: 7 }, children: [_jsx("div", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: label }), _jsxs("div", { style: { display: "grid", gap: 8 }, children: [value.length === 0 ? (_jsx("div", { style: {
                            border: "1px dashed #d1d5db",
                            borderRadius: 8,
                            color: "#6b7280",
                            fontSize: 13,
                            padding: "9px 10px",
                        }, children: emptyValueLabel })) : null, value.map((item, index) => (_jsxs("div", { style: { alignItems: "center", display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr) auto" }, children: [_jsx("input", { disabled: disabled, onBlur: () => {
                                    const cleaned = value.map((entry) => entry.trim()).filter(Boolean);
                                    if (JSON.stringify(cleaned) !== JSON.stringify(value)) {
                                        onChange(cleaned);
                                    }
                                }, onChange: (event) => updateItem(index, event.currentTarget.value), placeholder: placeholder, style: {
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    fontSize: 14,
                                    minWidth: 0,
                                    padding: "9px 10px",
                                }, type: "text", value: item }), _jsx("button", { disabled: disabled, onClick: () => removeItem(index), style: {
                                    background: "white",
                                    border: "1px solid #d1d5db",
                                    borderRadius: 8,
                                    color: "#374151",
                                    cursor: disabled ? "not-allowed" : "pointer",
                                    fontWeight: 700,
                                    padding: "9px 12px",
                                }, type: "button", children: "Remove" })] }, index)))] }), _jsx("button", { disabled: disabled, onClick: addItem, style: {
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    color: "#374151",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    justifySelf: "start",
                    padding: "9px 12px",
                }, type: "button", children: newItemLabel }), _jsx("span", { style: { color: "#6b7280", fontSize: 12 }, children: children })] }));
}
function CheckboxField({ label, checked, disabled, children, onChange, }) {
    return (_jsxs("label", { style: { color: "#374151", display: "grid", gap: 3, fontSize: 13 }, children: [_jsxs("span", { style: { alignItems: "center", display: "flex", gap: 8 }, children: [_jsx("input", { checked: checked, disabled: disabled, onChange: (event) => onChange(event.currentTarget.checked), type: "checkbox" }), label] }), _jsx("span", { style: { color: "#6b7280", fontSize: 12, marginLeft: 22 }, children: children })] }));
}
function RoutingRow({ title, chatId, topicId, chatPlaceholder, topicPlaceholder, chatHelp, disabled, children, footer, onChatIdChange, onTopicIdChange, }) {
    return (_jsxs("div", { style: {
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            display: "grid",
            gap: 10,
            padding: 12,
        }, children: [_jsxs("div", { style: { alignItems: "center", display: "flex", gap: 12, justifyContent: "space-between" }, children: [_jsx("strong", { children: title }), children ? _jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 12 }, children: children }) : null] }), _jsx("div", { style: { display: "grid", gap: 10 }, children: _jsxs("div", { style: twoColumnGridStyle, children: [_jsxs("label", { style: pairedFieldStyle, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Chat ID" }), _jsx("input", { disabled: disabled, onChange: (event) => onChatIdChange(event.currentTarget.value), placeholder: chatPlaceholder, style: standardInputStyle, type: "text", value: chatId }), _jsx("span", { style: helperTextStyle, children: chatHelp })] }), _jsxs("label", { style: pairedFieldStyle, children: [_jsx("span", { style: { color: "#4b5563", fontSize: 12, fontWeight: 700 }, children: "Topic ID" }), _jsx("input", { disabled: disabled, onChange: (event) => onTopicIdChange(event.currentTarget.value), placeholder: topicPlaceholder, style: standardInputStyle, type: "text", value: topicId }), _jsx("span", { style: helperTextStyle, children: "Optional. Used only when the Chat ID points to a Telegram forum group." })] })] }) }), footer ? _jsx("div", { style: { display: "grid", gap: 10 }, children: footer }) : null] }));
}
