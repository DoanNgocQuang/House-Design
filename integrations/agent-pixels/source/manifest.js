// src/manifest.ts
var PLUGIN_ID = "4d696994-e10d-4a05-a063-ca8b6e95de80";
var PLUGIN_VERSION = "2026.807.2";
var PAGE_ROUTE = "agent-pixels";
var SLOT_IDS = {
  sidebar: "agent-pixels-sidebar",
  page: "agent-pixels-camera-page",
  settingsPage: "agent-pixels-settings-page"
};
var EXPORT_NAMES = {
  sidebar: "AgentPixelsSidebarLink",
  page: "AgentPixelsCameraPage",
  settingsPage: "AgentPixelsSettingsPage"
};
var manifest = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Agent Pixels",
  description: "Security camera style pixel office view for Paperclip companies.",
  author: "tomartec",
  categories: ["ui"],
  capabilities: [
    "companies.read",
    "agents.read",
    "issues.read",
    "events.emit",
    "issues.update",
    "issues.create",
    "issues.wakeup",
    "issue.comments.create",
    "ui.action.register",
    "issue.comments.read",
    "plugin.state.read",
    "plugin.state.write",
    "events.subscribe",
    "instance.settings.register",
    "ui.sidebar.register",
    "ui.page.register"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
  ui: {
    slots: [
      {type: "page", id: "agent-chat-rooms", displayName: "Chat room", exportName: "AgentChatRoomsPage", routePath: "agent-chat-rooms"},
      {
        type: "sidebar",
        id: SLOT_IDS.sidebar,
        displayName: "Agent Pixels",
        exportName: EXPORT_NAMES.sidebar
      },
      {
        type: "page",
        id: SLOT_IDS.page,
        displayName: "Agent Pixels",
        exportName: EXPORT_NAMES.page,
        routePath: PAGE_ROUTE
      },
      {
        type: "settingsPage",
        id: SLOT_IDS.settingsPage,
        displayName: "Agent Pixels Settings",
        exportName: EXPORT_NAMES.settingsPage
      }
    ]
  }
};
var manifest_default = manifest;
export {
  EXPORT_NAMES,
  PAGE_ROUTE,
  PLUGIN_ID,
  PLUGIN_VERSION,
  SLOT_IDS,
  manifest_default as default
};
