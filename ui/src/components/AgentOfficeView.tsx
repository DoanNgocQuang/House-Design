import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize, Minimize, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select";
import "./agent-office.css";

const officeDate = new Intl.DateTimeFormat(undefined, { dateStyle: "full" });
const officeTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const lightingKey = "paperclip.agent-office.lighting";
type LightingMode = "auto" | "day" | "night";

function readLightingMode(): LightingMode {
  try {
    const value = localStorage.getItem(lightingKey);
    if (value === "day" || value === "night") return value;
  } catch {
    // Lighting can still be changed for this tab when storage is unavailable.
  }
  return "auto";
}

export function AgentOfficeView({ children }: { children: ReactNode }) {
  const office = useRef<HTMLElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [lighting, setLighting] = useState(readLightingMode);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const night = lighting === "auto" ? now.getHours() < 6 || now.getHours() >= 18 : lighting === "night";
  const LightIcon = night ? Moon : Sun;
  const FullscreenIcon = fullscreen ? Minimize : Maximize;

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    const onFullscreenChange = () => setFullscreen(document.fullscreenElement === office.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  async function toggleFullscreen() {
    if (!office.current) return;
    setFullscreenError(false);
    try {
      if (document.fullscreenElement === office.current) await document.exitFullscreen();
      else await office.current.requestFullscreen();
    } catch {
      setFullscreenError(true);
    }
  }

  return (
    <section ref={office} aria-label="Agent Office" data-lighting={night ? "night" : "day"}
      className="pixel-office-view fixed inset-0 z-50 flex flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-sm font-semibold">Agent Office</h1>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <LightIcon className="size-4" aria-hidden="true" />
            {night ? "Night" : "Day"}
          </span>
          <time dateTime={now.toISOString()} className="font-mono text-sm font-medium tabular-nums">{officeTime.format(now)}</time>
          <span className="text-xs text-muted-foreground">{officeDate.format(now)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect aria-label="Lighting" className="w-auto text-xs" value={lighting}
            onChange={event => {
              const mode = event.target.value as LightingMode;
              setLighting(mode);
              try { localStorage.setItem(lightingKey, mode); } catch { /* The current tab still updates. */ }
            }}>
            <option value="auto">Auto lighting</option>
            <option value="day">Day</option>
            <option value="night">Night</option>
          </NativeSelect>
          {document.fullscreenEnabled && (
            <Button variant="ghost" size="sm" onClick={() => void toggleFullscreen()}>
              <FullscreenIcon aria-hidden="true" />
              {fullscreen ? "Exit full screen" : "Full screen"}
            </Button>
          )}
          <div data-office-settings />
        </div>
        {fullscreenError && <p role="status" className="text-xs text-muted-foreground">The browser could not switch full screen mode.</p>}
      </header>
      <div className="agent-office-content min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
