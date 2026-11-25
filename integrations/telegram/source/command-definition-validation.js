const VALID_STEP_TYPES = [
    "fetch_issue",
    "invoke_agent",
    "http_request",
    "send_message",
    "create_issue",
    "wait_approval",
    "set_state",
];
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"];
const NAME_PATTERN = /^[a-zA-Z0-9_]{1,32}$/;
const MAX_INTERPOLATED_LENGTH = 40;
/**
 * A step `id`/`type` reaches error-message interpolation before any length
 * check, so an oversized value (e.g. a multi-KB `id`) can push a reply past
 * Telegram's 4096-char limit. `sendMessage` swallows that rejection, leaving
 * the user with silence instead of the error this validation exists to show.
 */
function truncateForDisplay(value) {
    return value.length > MAX_INTERPOLATED_LENGTH
        ? `${value.slice(0, MAX_INTERPOLATED_LENGTH)}…`
        : value;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function isStringRecord(value) {
    return isRecord(value) && Object.values(value).every((v) => typeof v === "string");
}
function isStepType(value) {
    return VALID_STEP_TYPES.includes(value);
}
function validateStep(value, index) {
    const position = `Step ${index + 1}`;
    if (!isRecord(value)) {
        return { ok: false, error: `${position} must be an object.` };
    }
    const id = value.id;
    if (!isNonEmptyString(id)) {
        return { ok: false, error: `${position} must have an 'id' field.` };
    }
    const label = `${position} ('${truncateForDisplay(id)}')`;
    const type = value.type;
    if (!isNonEmptyString(type)) {
        return { ok: false, error: `${label} must have a 'type' field.` };
    }
    if (!isStepType(type)) {
        return { ok: false, error: `Invalid step type: '${truncateForDisplay(type)}' (${label}). Valid: ${VALID_STEP_TYPES.join(", ")}` };
    }
    const name = typeof value.name === "string" ? value.name : undefined;
    const base = { id, name };
    const missing = (field) => ({
        ok: false,
        error: `${label} of type '${type}' must have a '${field}' field.`,
    });
    const badType = (field, expected) => ({
        ok: false,
        error: `${label} of type '${type}': '${field}' must be ${expected}.`,
    });
    switch (type) {
        case "fetch_issue": {
            if (!isNonEmptyString(value.issueId))
                return missing("issueId");
            return { ok: true, step: { ...base, type, issueId: value.issueId } };
        }
        case "invoke_agent": {
            if (!isNonEmptyString(value.agentId))
                return missing("agentId");
            if (!isNonEmptyString(value.prompt))
                return missing("prompt");
            return { ok: true, step: { ...base, type, agentId: value.agentId, prompt: value.prompt } };
        }
        case "http_request": {
            if (!isNonEmptyString(value.url))
                return missing("url");
            const method = value.method;
            if (!HTTP_METHODS.includes(method)) {
                return badType("method", `one of ${HTTP_METHODS.join(", ")}`);
            }
            if (value.headers !== undefined && !isStringRecord(value.headers)) {
                return badType("headers", "an object of string values");
            }
            if (value.body !== undefined && typeof value.body !== "string") {
                return badType("body", "a string");
            }
            return {
                ok: true,
                step: {
                    ...base,
                    type,
                    url: value.url,
                    method: method,
                    headers: value.headers,
                    body: value.body,
                },
            };
        }
        case "send_message": {
            if (!isNonEmptyString(value.text))
                return missing("text");
            return { ok: true, step: { ...base, type, text: value.text } };
        }
        case "create_issue": {
            if (!isNonEmptyString(value.title))
                return missing("title");
            if (value.description !== undefined && typeof value.description !== "string") {
                return badType("description", "a string");
            }
            if (value.projectId !== undefined && typeof value.projectId !== "string") {
                return badType("projectId", "a string");
            }
            if (value.assigneeAgentId !== undefined && typeof value.assigneeAgentId !== "string") {
                return badType("assigneeAgentId", "a string");
            }
            return {
                ok: true,
                step: {
                    ...base,
                    type,
                    title: value.title,
                    description: value.description,
                    projectId: value.projectId,
                    assigneeAgentId: value.assigneeAgentId,
                },
            };
        }
        case "wait_approval": {
            if (!isNonEmptyString(value.prompt))
                return missing("prompt");
            if (value.timeoutMs !== undefined && typeof value.timeoutMs !== "number") {
                return badType("timeoutMs", "a number");
            }
            return { ok: true, step: { ...base, type, prompt: value.prompt, timeoutMs: value.timeoutMs } };
        }
        case "set_state": {
            if (!isNonEmptyString(value.key))
                return missing("key");
            if (typeof value.value !== "string")
                return missing("value");
            return { ok: true, step: { ...base, type, key: value.key, value: value.value } };
        }
    }
}
/**
 * Validates a `JSON.parse`d value against the `CustomCommand` shape before
 * anything downstream (storage, then `executeWorkflow`) trusts it. Every
 * `steps[]` entry is checked against its declared `type`'s required fields,
 * not just the `id`/`type` pair — a `send_message` step missing `text`, or an
 * `http_request` step with a non-string `body`, is rejected here rather than
 * failing mid-run with no link back to the import.
 */
export function validateCommandDefinition(parsed) {
    if (!isRecord(parsed)) {
        return { ok: false, error: "Command definition must be a JSON object with 'name' and 'steps' fields." };
    }
    if (!isNonEmptyString(parsed.name)) {
        return { ok: false, error: "Command definition must have a 'name' field." };
    }
    if (!NAME_PATTERN.test(parsed.name)) {
        return { ok: false, error: "Command definition 'name' must match ^[a-zA-Z0-9_]{1,32}$ (letters, numbers, underscores only, max 32 chars, no whitespace)." };
    }
    if (parsed.description !== undefined && typeof parsed.description !== "string") {
        return { ok: false, error: "Command definition 'description' must be a string." };
    }
    if (!Array.isArray(parsed.steps)) {
        return { ok: false, error: "Command definition must have a 'steps' array field." };
    }
    const steps = [];
    for (let i = 0; i < parsed.steps.length; i++) {
        const result = validateStep(parsed.steps[i], i);
        if (!result.ok)
            return { ok: false, error: result.error };
        steps.push(result.step);
    }
    return {
        ok: true,
        definition: {
            name: parsed.name,
            description: typeof parsed.description === "string" ? parsed.description : "No description",
            steps,
        },
    };
}
