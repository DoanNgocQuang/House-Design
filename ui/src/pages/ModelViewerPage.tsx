import { lazy, Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

// Three.js loads only on this page.
const ModelAttachmentPreview = lazy(() => import("@/components/ModelAttachmentPreview"));

/** Full-window 3D viewer opened in its own browser tab, without the board sidebar. */
export function ModelViewerPage() {
  const { attachmentId = "" } = useParams();
  const [search] = useSearchParams();
  const issueId = search.get("issue") ?? "";
  const name = search.get("name") || "model.glb";
  useEffect(() => { document.title = `${name} · Mô hình 3D`; }, [name]);
  useLightTheme();

  if (!attachmentId || !issueId) {
    return <p className="p-4 text-sm text-destructive" role="alert">Thiếu thông tin file 3D. Hãy mở lại từ tab Files hoặc trang Mô hình 3D.</p>;
  }
  return <main className="h-dvh w-full bg-background">
    <Suspense fallback={<p className="p-4 text-sm" role="status">Đang tải trình xem 3D…</p>}>
      <ModelAttachmentPreview issueId={issueId}
        attachment={{ id: attachmentId, originalFilename: name }}
        downloadUrl={`/api/attachments/${encodeURIComponent(attachmentId)}/content?download=1`} />
    </Suspense>
  </main>;
}

/**
 * The viewer always uses the light tokens: a daylight scene (sky, grass) reads best in a light frame.
 * The app's dark mode is the `.dark` class on <html>; this tab removes it while open and puts it back on leave.
 */
export function useLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => { if (wasDark) root.classList.add("dark"); };
  }, []);
}

/** Link target for opening a .glb in a new tab; relative to the company prefix. */
export function modelViewerPath(companyPrefix: string, model: { attachmentId: string; filename: string; issue: { id: string } }) {
  const query = new URLSearchParams({ issue: model.issue.id, name: model.filename });
  return `/${encodeURIComponent(companyPrefix)}/model-viewer/${encodeURIComponent(model.attachmentId)}?${query}`;
}
