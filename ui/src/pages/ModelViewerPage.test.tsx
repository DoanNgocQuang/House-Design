// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useLightTheme } from "./ModelViewerPage";

function Probe() {
  useLightTheme();
  return null;
}

afterEach(() => {
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

it("drops the dark theme while the viewer is open and restores it on leave", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  document.documentElement.classList.add("dark");
  const host = document.createElement("div");
  const root = createRoot(host);
  await act(async () => root.render(<Probe />));
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  await act(async () => root.unmount());
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

it("leaves a light app light after leaving", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div");
  const root = createRoot(host);
  await act(async () => root.render(<Probe />));
  await act(async () => root.unmount());
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});
