import { useQuery } from "@tanstack/react-query";
import { Box, Download, FileText } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/context/CompanyContext";
import { formatBytes } from "@/lib/issue-output";
import { isModelAttachment } from "@/lib/model-preview";
import { Link } from "@/lib/router";
import { modelViewerPath } from "@/pages/ModelViewerPage";

export type ProjectFile = {
  attachmentId: string;
  filename: string;
  contentType: string;
  byteSize: number;
  createdAt: string;
  createdByAgent: string | null;
  issue: { id: string; identifier: string | null; title: string; status: string };
};

const dates = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
const cell = "border-b px-3 py-2";
const contentUrl = (file: ProjectFile, download = false) =>
  `/api/attachments/${encodeURIComponent(file.attachmentId)}/content${download ? "?download=1" : ""}`;

export function ProjectFiles({ companyId, projectId }: { companyId: string; projectId: string }) {
  const companyPrefix = useCompany().selectedCompany?.issuePrefix;
  const files = useQuery({
    queryKey: ["project-files", companyId, projectId],
    queryFn: ({ signal }) => api.get<{ files: ProjectFile[] }>(`/companies/${companyId}/projects/${projectId}/files`, { signal }),
  });
  const rows = files.data?.files ?? [];

  return <section className="flex min-w-0 flex-col gap-3" aria-label="Files">
    <p className="text-sm text-muted-foreground">Các file đính kèm trong task của project này. Mỗi tên file chỉ hiện bản mới nhất.</p>
    {files.isError ? <div className="flex items-center gap-2" role="alert">Không tải được danh sách file. <Button variant="outline" size="sm" onClick={() => void files.refetch()}>Thử lại</Button></div> :
      files.isPending ? <p role="status">Đang tải danh sách file…</p> :
      !rows.length ? <p className="text-sm text-muted-foreground">Project này chưa có file nào.</p> :
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground">
            {["File", "Task", "Người tạo", "Ngày", "Dung lượng", ""].map((label) => <th key={label} className={`${cell} font-medium`}>{label}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((file) => {
              const isModel = isModelAttachment({ contentType: file.contentType, originalFilename: file.filename });
              const Icon = isModel ? Box : FileText;
              return <tr key={file.attachmentId}>
                <td className={`${cell} font-medium`}>
                  <span className="flex items-center gap-2"><Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />{file.filename}</span>
                </td>
                <td className={cell}>
                  <Link className="hover:underline" title={file.issue.title} to={`/issues/${encodeURIComponent(file.issue.identifier ?? file.issue.id)}`}>
                    <span className="font-mono text-xs">{file.issue.identifier}</span> {file.issue.title}
                  </Link>
                </td>
                <td className={cell}>{file.createdByAgent ?? "Bạn"}</td>
                <td className={`${cell} tabular-nums`}>{dates.format(new Date(file.createdAt))}</td>
                <td className={`${cell} tabular-nums`}>{formatBytes(file.byteSize)}</td>
                <td className={`${cell} text-right`}>
                  <span className="inline-flex items-center gap-1">
                    {isModel
                      ? <Button size="sm" asChild disabled={!companyPrefix}>
                          <a href={companyPrefix ? modelViewerPath(companyPrefix, file) : undefined} target="_blank" rel="noreferrer">Xem 3D</a>
                        </Button>
                      : <Button size="sm" variant="outline" asChild><a href={contentUrl(file)} target="_blank" rel="noreferrer">Mở</a></Button>}
                    <Button size="icon-sm" variant="ghost" asChild>
                      <a href={contentUrl(file, true)} aria-label={`Tải ${file.filename}`} title="Tải về"><Download aria-hidden /></a>
                    </Button>
                  </span>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>}
  </section>;
}
