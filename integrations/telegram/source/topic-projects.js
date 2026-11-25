function normalizeTopicMapping(projectName, value) {
    if (typeof value === "string") {
        return { projectName, topicId: value };
    }
    return {
        projectId: value.projectId,
        projectName: value.projectName || projectName,
        topicId: value.topicId,
    };
}
export async function resolveMappedProjectIdForTopic(ctx, chatId, companyId, messageThreadId) {
    if (!messageThreadId)
        return undefined;
    const topicMap = (await ctx.state.get({
        scopeKind: "instance",
        stateKey: `topic-map-${chatId}`,
    }));
    if (!topicMap)
        return undefined;
    const topicId = String(messageThreadId);
    const match = Object.entries(topicMap)
        .map(([projectName, value]) => normalizeTopicMapping(projectName, value))
        .find((mapping) => mapping.topicId === topicId);
    if (!match)
        return undefined;
    if (match.projectId)
        return match.projectId;
    try {
        const projects = await ctx.projects.list({ companyId, limit: 100 });
        const exactMatch = projects.find((project) => project.name === match.projectName);
        if (exactMatch)
            return exactMatch.id;
        return projects.find((project) => project.name?.toLowerCase() === match.projectName.toLowerCase())?.id;
    }
    catch (err) {
        ctx.logger.warn("Failed to look up project for legacy topic mapping", {
            chatId,
            companyId,
            projectName: match.projectName,
            error: String(err),
        });
        return undefined;
    }
}
