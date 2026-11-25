# Kế hoạch triển khai: Nhà 3D theo bộ phận, nội thất và trình xem 3D trong Paperclip

> **Cho agent thực hiện:** BẮT BUỘC dùng sub-skill superpowers:subagent-driven-development (khuyên dùng) hoặc superpowers:executing-plans để làm theo từng task. Các bước đánh dấu bằng checkbox (`- [ ]`).

**Mục tiêu:** `model.glb` gồm các bộ phận có tên (kể cả nội thất), có màu cấu hình được, xem được ngay trong task Paperclip với cây bộ phận, chọn màu, lắp ráp/tách rời và lưu bảng màu thành comment.

**Kiến trúc:**
- Script Python `house_builder.py` (chỉ dùng thư viện chuẩn) dựng danh sách bộ phận và ghi GLB có một node cho mỗi bộ phận.
- Nội thất lấy từ thư viện OBJ của Kenney (CC0), vendor vào skill.
- UI Paperclip thêm `ModelAttachmentPreview` (Three.js, tải lười), được gọi từ `TaskAttachmentPanel`.
- Agent và skill được cập nhật để truyền màu và nội thất qua `spec.json` và `layout.json`.

**Công nghệ:** Python 3 stdlib; React 19, Vite, Tailwind v4, Vitest; `three` (GLTFLoader, OrbitControls).

**Spec:** `doc/plans/2026-11-22-glb-model-viewer.md`.

## Ràng buộc chung

- `house_builder.py` chỉ dùng thư viện chuẩn của Python. `viewer.html` phải < 512 KB và không gọi mạng.
- `partId` phải ổn định: cùng layout thì cho cùng id qua mọi lần dựng.
- Thứ tự ưu tiên màu: `colors.parts[partId]` > `colors.categories[category]` > màu mặc định (nội thất mặc định giữ màu MTL gốc).
- Loại bộ phận (`category`): `floor | wall | door | glass | stairs | furniture | roof`.
- UI: Three.js chỉ được tải khi mở file 3D (dynamic import). Màu khung giao diện dùng token trong `ui/src/index.css` (`DESIGN.md`). Chữ hiển thị viết tiếng Việt và gọi là "task".
- Nhận diện file 3D: tên kết thúc `.glb` (không phân biệt hoa thường) hoặc content-type `model/gltf-binary`. Giới hạn xem: 50 MB.
- Comment bảng màu: dòng `Bảng màu cho <tên file>`, tiếp theo là khối ```` ```json ```` chứa `{"houseColors":{"file":"<tên file>","categories":{...},"parts":{...}}}`.
- Không commit hay push khi chủ dự án chưa yêu cầu.

## Review Focus

1. **Layout cũ không có `colors` hay `furniture`:** dựng phải ra kết quả như trước, chỉ dùng màu mặc định. Test ở Task 1.
2. **Bảng màu chứa `partId` không còn tồn tại** sau khi sửa mặt bằng: bỏ qua id đó, các id khác vẫn áp dụng được, và không báo lỗi. Test ở Task 1 (builder) và Task 4 (UI).
3. **Đồ nội thất xoay 90°/270° sát tường:** khi kiểm tra đồ có nằm trong phòng không, phải hoán đổi `w` và `d`. Test ở Task 2.
4. **Nhà 3 tầng nhiều nội thất:** `viewer.html` vẫn < 512 KB nhờ tự tăng kích thước ô chia. Test ở Task 2.
5. **File đính kèm `.GLB` (chữ hoa) hoặc content-type `application/octet-stream`:** vẫn mở trình xem 3D. Test ở Task 4.

---

### Task 1: Dựng nhà theo bộ phận, có màu và cánh cửa

**Files:**
- Modify: `D:/AI-company/studio-nha-3d/skills/house-builder/scripts/house_builder.py`

**Interfaces:**
- Produces:
  - `build_parts(layout: dict) -> list[dict]`. Mỗi part là `{"id": str, "name": str, "category": str, "floor": int, "room": str | None, "order": int, "faces": [(rgb: tuple[float, float, float], poly: list[tuple[float, float, float]])]}`. Các tầng đánh số 1..N; mái và trần dùng `floor = N + 1`.
  - `resolve_color(part, colors: dict) -> tuple | None`: trả về màu ghi đè, hoặc `None` nếu giữ màu gốc của mặt.
  - `write_glb(parts, path)`, `write_iso_svg(parts, path)`, `write_viewer(parts, layout, path)`, `build(layout, out_dir) -> list[dict]`.
  - `validate()` giữ nguyên chữ ký. Hàm `build_faces` cũ bị thay bởi `build_parts`.

**Quy tắc `id` và `name`** (`n(v)` = `f"{v:g}".replace(".", "p")`):

| Bộ phận | `id` | `name` |
|---|---|---|
| Sàn | `t{f}-{room}-san` | `T{f} · {tên phòng} · Sàn` |
| Tường | `t{f}-tuong-{h\|v}{n(pos)}-{n(a)}-{n(b)}` (một đoạn đã gộp, gồm cả các mảnh quanh ô cửa) | `T{f} · Tường {ngang y=…\|dọc x=…} ({các phòng có cạnh này, nối bằng " \| "})` |
| Kính | `t{f}-{room}-kinh-{side}-{i}` (`i` = vị trí trong `openings` của tầng) | |
| Cánh cửa | `t{f}-{room}-cua-{side}-{i}` (tấm dày 0.04 m, chiếm toàn bộ ô cửa) | |
| Cầu thang | `t{f}-{room}-cau-thang` | |
| Trần tầng trên cùng | `tran` | |
| Mái | `mai` (gồm cả lan can mái bằng) | |

- `order` = `(floor - 1) * 10 + rank`, với rank: floor 0, wall 1, door 2, glass 2, stairs 3, furniture 4. Mái và trần có `order = 1000`.
- Màu mặc định theo loại: floor `(0.78,0.72,0.62)`, wall `(0.94,0.91,0.85)`, door `(0.55,0.36,0.22)`, glass `(0.50,0.70,0.84)`, stairs `(0.55,0.43,0.39)`, roof `(0.70,0.31,0.22)`.

- [ ] **Bước 1: Viết test (thêm vào `selftest`) cho các hành vi mới**

```python
parts = build_parts(EXAMPLE)
ids = [p["id"] for p in parts]
assert len(ids) == len(set(ids)), "partId bi trung"
assert ids == [p["id"] for p in build_parts(EXAMPLE)], "partId khong on dinh"
cats = {p["category"] for p in parts}
assert {"floor", "wall", "door", "glass", "stairs", "roof"} <= cats
assert any(p["id"] == "t1-gara-cua-front-0" for p in parts)
colored = dict(EXAMPLE, colors={"categories": {"roof": "#112233"}, "parts": {"t1-gara-san": "#ff0000", "khong-ton-tai": "#00ff00"}})
roof = next(p for p in build_parts(colored) if p["id"] == "mai")
assert resolve_color(roof, colored["colors"]) == (0x11 / 255, 0x22 / 255, 0x33 / 255)
# GLB: node goc "Nha", moi part la 1 node co extras.partId; material khop mau ghi de
nodes = gltf["nodes"]
assert nodes[0]["name"] == "Nhà"
assert sum(1 for n in nodes if "extras" in n and "partId" in n["extras"]) == len(parts)
assert any(m["pbrMetallicRoughness"]["baseColorFactor"][:3] == [1.0, 0.0, 0.0] for m in gltf["materials"])
```

- [ ] **Bước 2:** chạy `python house_builder.py selftest` → FAIL (`build_parts` chưa có).
- [ ] **Bước 3:** cài đặt `build_parts`, `resolve_color`, và ghi GLB theo node. Cây node: `Nhà` → `Tầng 1..N` và `Mái`; part nằm dưới node tầng của nó (mái và trần nằm dưới `Mái`). Mỗi part có 1 mesh, mỗi màu trong part là 1 primitive. Material được dùng chung theo màu. `extras` = `{partId, category, floor, room, order}`. `iso.svg` và `viewer.html` lấy màu đã resolve. Dữ liệu viewer thêm chỉ số part cho mỗi mặt: `[colorIdx, floor, partIdx, ...coords]`, kèm danh sách `parts: [{id, name, category}]`.
- [ ] **Bước 4:** chạy `python house_builder.py selftest` → `selftest OK`. Dựng `EXAMPLE` ra thư mục tạm, mở `viewer.html` qua `python -m http.server`: nhà trông như cũ, có thêm cánh cửa.

### Task 2: Nội thất (thư viện Kenney CC0)

**Files:**
- Create: `studio-nha-3d/skills/house-builder/assets/furniture/` (chọn lọc khoảng 35 cặp `.obj` + `.mtl` từ `Models/OBJ format/` của `kenney_furniture-kit.zip`, cộng `License.txt`)
- Create: `studio-nha-3d/skills/house-builder/assets/furniture/catalog.json`
- Modify: `house_builder.py`

**Interfaces:**
- Consumes: `build_parts`, `resolve_color` (Task 1).
- Produces:
  - `load_catalog() -> dict[str, dict]`
  - `load_obj(path: Path) -> list[tuple[rgb, poly]]`: toạ độ gốc của OBJ, màu lấy từ `Kd` trong MTL.
  - Lệnh CLI `catalog` in bảng `mã | tên | w x d x h | loại phòng`.
  - `validate()` kiểm tra thêm phần `floors[].furniture`.

**`catalog.json`:**
```json
{"giuong-doi": {"name": "Giường đôi", "obj": "bedDouble.obj", "w": 1.6, "d": 2.0, "rooms": ["bedroom"], "clearance": 0.6}}
```
- Kích thước `w × d` là kích thước thật (mét). Scale đồng đều = `w / bề rộng X của OBJ`. Đặt món đồ sao cho tâm hộp bao trên mặt phẳng XZ nằm tại `(x, y)` của layout, đáy nằm trên sàn tầng đó.
- Mặc định mặt trước của món đồ quay về `+Z` của OBJ, tức là hướng mặt tiền (`y` nhỏ) khi `rotation: 0`. Xoay theo chiều kim đồng hồ khi nhìn từ trên xuống.
- Mã tối thiểu phải có:
  - Phòng ngủ: `giuong-doi`, `giuong-don`, `tu-dau-giuong`, `tu-quan-ao`.
  - Phòng khách: `sofa-3`, `sofa-goc`, `ban-tra`, `ke-tivi`, `tivi`.
  - Bếp và phòng ăn: `ban-an`, `ghe`, `tu-bep`, `tu-bep-tren`, `bep-nau`, `tu-lanh`, `bon-rua-bat`.
  - WC: `bon-cau`, `lavabo`, `voi-sen`, `bon-tam`, `may-giat`.
  - Khác: `ban-lam-viec`, `ghe-lam-viec`, `ke-sach`, `cay-canh`, `tham`, `den-cay`.

**Validate nội thất:**
- **Lỗi:** `item` không có trong catalog; `room` không tồn tại; hộp chiếm chỗ (đổi `w` và `d` cho nhau khi xoay 90°/270°) tràn ra ngoài phòng quá 0.02 m; hai món chồng lên nhau quá 0.01 m²; đặt trong phòng cầu thang; chắn ô cửa đi (giao với hình chữ nhật dài 0.8 m vào trong phòng, rộng bằng ô cửa).
- **Cảnh báo:** phòng ngủ thiếu giường, bếp thiếu `tu-bep`, WC thiếu `bon-cau`.

- [ ] **Bước 1: Viết test trong `selftest`**
  - `EXAMPLE` có nội thất: giường đôi ở `ngu1`, sofa ở `khach`, bồn cầu ở `wc1` → `validate` không có lỗi và có ≥ 3 part loại `furniture`.
  - Giường xoay 90° đặt sát tường phải hợp lệ; dịch ra ngoài tường 0.3 m thì báo lỗi tràn phòng.
  - Ghế đặt ngay trước cửa gara phía sau → lỗi `chan cua`.
  - Mã `khong-co` → lỗi catalog.
  - Nhà 3 tầng (3 lần `EXAMPLE` tầng 2) với 15 món đồ → `viewer.html` < 512 KB.
- [ ] **Bước 2:** chạy selftest → FAIL.
- [ ] **Bước 3:** chép các OBJ/MTL đã chọn và `License.txt` từ bản đã giải nén trong scratchpad (`kenney-obj/`). Viết `catalog.json`, `load_obj` (đọc `v`, `f` dạng `a/b/c`, `usemtl`, `mtllib`) và phần đặt đồ trong `build_parts`. Tên part: `T{f} · {tên phòng} · {tên món}`. Viewer: nếu dữ liệu vượt 450 KB thì dựng lại với ô chia 2.0 m, và không chia nhỏ mặt của đồ nội thất.
- [ ] **Bước 4:** chạy selftest → OK. Xem `viewer.html` của `EXAMPLE` có nội thất: đồ nằm trên sàn, đúng phòng, đúng hướng.

### Task 3: Skill và schema (màu và nội thất)

**Files:**
- Modify: `studio-nha-3d/skills/kien-truc-nha-o/schemas/spec.schema.json`
  - Thêm `colors: {categories, parts}`; thêm `rooms[].furniture_notes: string`.
- Modify: `studio-nha-3d/skills/kien-truc-nha-o/schemas/layout.schema.json`
  - Thêm `colors`; thêm `floors[].furniture[]: {id, item, room, x, y, rotation ∈ {0, 90, 180, 270}, color?}`.
- Create: `studio-nha-3d/skills/kien-truc-nha-o/references/noi-that-chuan.md`
  - Bộ đồ mặc định cho từng loại phòng; khoảng trống (lối đi ≥ 0.6 m, trước tủ ≥ 0.8 m, quanh giường ≥ 0.6 m ở 2 bên); quy tắc đặt đồ.
- Modify: `studio-nha-3d/skills/kien-truc-nha-o/references/checklist.md`
  - Thêm mục D: màu khớp yêu cầu hoặc bảng màu; mỗi phòng có đủ đồ thiết yếu; đồ không chắn cửa hay cầu thang.
- Modify: `studio-nha-3d/skills/house-builder/SKILL.md`
  - Mô tả cây bộ phận và `partId`, `colors`, `furniture`, lệnh `catalog`, cách gộp `houseColors` từ comment vào `layout.colors`.

- [ ] **Bước 1:** kiểm tra `layout.json` mẫu (`house_builder.py example`, đã có nội thất từ Task 2) hợp lệ theo schema mới. Dùng một script kiểm tra nhỏ trong selftest: so khoá bắt buộc và tập giá trị enum của `rotation` và `category` với schema. Chạy → PASS.

### Task 4: Hàm thuần trong UI: nhận diện file 3D và bảng màu

**Files:**
- Create: `ui/src/lib/model-preview.ts`
- Test: `ui/src/lib/model-preview.test.ts`

**Interfaces:**
- Produces:
  - `export const MODEL_PREVIEW_MAX_BYTES = 50 * 1024 * 1024`
  - `export type HousePalette = { categories: Record<string, string>; parts: Record<string, string> }`
  - `export const PART_CATEGORY_LABELS: Record<string, string>` = `{ floor: "Sàn", wall: "Tường", door: "Cửa đi", glass: "Kính", stairs: "Cầu thang", furniture: "Nội thất", roof: "Mái" }`
  - `export function isModelAttachment(a: { contentType?: string | null; originalFilename?: string | null }): boolean`
  - `export function buildPaletteComment(fileName: string, palette: HousePalette): string`
  - `export function parseLatestPalette(comments: { body: string; createdAt: string | Date }[], fileName: string): HousePalette | null`
  - `export function applyPalette(base: HousePalette, overlay: HousePalette, knownPartIds: Set<string>): HousePalette` (bỏ các id lạ)

- [ ] **Bước 1: Viết test**
  - `isModelAttachment({originalFilename: "MODEL.GLB", contentType: "application/octet-stream"})` → `true`.
  - `isModelAttachment({contentType: "model/gltf-binary", originalFilename: null})` → `true`.
  - `isModelAttachment({originalFilename: "plan.svg", contentType: "image/svg+xml"})` → `false`.
  - Dựng comment bằng `buildPaletteComment`, rồi `parseLatestPalette` đọc lại phải ra đúng palette.
  - Khi có 2 comment cho cùng tên file, lấy comment có `createdAt` mới nhất. Comment của file khác bị bỏ qua. JSON hỏng bị bỏ qua (trả về `null` nếu không có comment nào hợp lệ).
  - `applyPalette` bỏ `parts["khong-ton-tai"]` và giữ `parts["t1-gara-san"]`.
- [ ] **Bước 2:** `pnpm exec vitest run ui/src/lib/model-preview.test.ts` → FAIL.
- [ ] **Bước 3:** cài đặt các hàm trên.
- [ ] **Bước 4:** chạy lại → PASS.

### Task 5: `ModelAttachmentPreview` và nối vào `TaskAttachmentPanel`

**Files:**
- Modify: `ui/package.json` (thêm `three`, `@types/three`), `pnpm-lock.yaml`. Chạy `corepack pnpm --filter @paperclipai/ui add three` và `corepack pnpm --filter @paperclipai/ui add -D @types/three`.
- Create: `ui/src/components/ModelAttachmentPreview.tsx` (`export default function ModelAttachmentPreview(props: { issueId: string; attachment: IssueAttachment; downloadUrl: string })`)
- Modify: `ui/src/components/task-side-panel/TaskAttachmentPanel.tsx`
  - Thêm `const ModelAttachmentPreview = lazy(() => import("@/components/ModelAttachmentPreview"))`.
  - Nếu `isModelAttachment(attachment)` và `byteSize <= MODEL_PREVIEW_MAX_BYTES` thì hiển thị component này trong `<Suspense fallback={<p role="status">Đang tải trình xem 3D…</p>}>`, trước nhánh xem trước file chữ. Query nội dung file chữ phải bị tắt cho file 3D.
- Test: `ui/src/components/task-side-panel/TaskAttachmentPanel.test.tsx` (tạo mới nếu chưa có, theo mẫu test component có sẵn trong repo)

**Hành vi của component:**
- Tải file bằng `fetch("/api/attachments/{id}/content", { credentials: "same-origin" })` → `arrayBuffer`, rồi `GLTFLoader.parse`. Mỗi node có `extras.partId` là một part; ghi nhớ màu gốc của từng material.
- **Bố cục:** khung 3D bên trái (`OrbitControls`, ánh sáng hemisphere + directional, nền lấy từ `getComputedStyle(--background)`). Bảng bên phải gồm:
  - Danh sách loại bộ phận (`PART_CATEGORY_LABELS`), mỗi loại có ô màu và nút ẩn/hiện.
  - Cây Tầng → part (gom theo `extras.floor`; nội thất gom thêm theo phòng).
  - Khi đã chọn part: tên part, `<input type="color">`, và checkbox "Áp dụng cho mọi {loại}".
- **Chọn part:** raycast khi bấm. Part được chọn có `emissive` bằng màu token `--primary` ở mức 0.25. Bấm ra ngoài thì bỏ chọn.
- **Lắp ráp:** ẩn tất cả, rồi lần lượt hiện từng part theo `order` tăng dần: mỗi part bắt đầu cao hơn vị trí thật 3 m và hạ xuống trong 400 ms, các part cách nhau `8000 / số part` ms (tối thiểu 20 ms). Nếu `prefers-reduced-motion` bật thì bỏ hiệu ứng.
- **Tách rời** (bật/tắt): tầng `f` nâng lên `(f - 1) * 2.5` m, mái nâng `N * 2.5 + 2` m.
- **Lưu bảng màu:** gọi `issuesApi.addComment(issueId, buildPaletteComment(file, changes))`, trong đó `changes` chỉ gồm các màu khác màu gốc. Thành công thì báo "Đã lưu bảng màu vào task"; lỗi thì hiện thông báo lỗi kèm nút thử lại (không nuốt lỗi).
- **Bảng màu đã lưu:** đọc bằng `issuesApi.listComments(issueId, { order: "desc", limit: 100 })` qua `useQuery(queryKeys.issues.comments(issueId))`. Nếu `parseLatestPalette` ra kết quả thì hiện nút "Áp dụng bảng màu đã lưu" (dùng `applyPalette`).
- **Dọn dẹp khi unmount:** dispose renderer, geometry và material; huỷ `requestAnimationFrame`.

- [ ] **Bước 1: Viết test cho panel**
  - Mock `issuesApi.listAttachments` trả về một file `model.glb`; mock `@/components/ModelAttachmentPreview` thành `() => <div>3d-viewer</div>`.
  - Render `TaskAttachmentPanel` → thấy `3d-viewer`, và **không** gọi fetch nội dung file chữ.
  - Với `plan.svg` → không hiển thị `3d-viewer`.
- [ ] **Bước 2:** `pnpm exec vitest run ui/src/components/task-side-panel/TaskAttachmentPanel.test.tsx` → FAIL.
- [ ] **Bước 3:** thêm dependency, viết component, nối vào panel.
- [ ] **Bước 4:** chạy lại test → PASS. Chạy `corepack pnpm --filter @paperclipai/ui exec tsc -b --noEmit` (hoặc `node ../scripts/run-tsc.mjs -b` trong `ui/`) → không có lỗi mới. Chạy `node scripts/check-token-gates.mjs` → không vi phạm token.
- [ ] **Bước 5:** chạy `corepack pnpm --filter @paperclipai/ui build`, rồi kiểm tra chunk `three` nằm riêng, không nằm trong entry chunk.

### Task 6: Agent: thêm Nội thất, cập nhật hướng dẫn và đẩy lên QLDA

**Files:**
- Create: `studio-nha-3d/agents/noi-that/AGENTS.md`
  - Role `designer`, báo cáo PM, skills `kien-truc-nha-o` và `house-builder`.
  - Các loại Sub-task: `Nội thất tầng N`, `Kiểm tra nội thất`. Làm trên `layout-draft.json` / `layout.json`; dùng lệnh `catalog`; tuân theo `noi-that-chuan.md`.
- Modify: `studio-nha-3d/agents/pm/AGENTS.md`
  - Thêm Task giai đoạn `Thiết kế nội thất` giữa Mặt bằng và Dựng hình: mỗi tầng 1 Sub-task (3 SP) cộng `Kiểm tra nội thất` (1 SP). Bỏ giai đoạn này nếu yêu cầu ghi "không cần nội thất".
  - Thêm quy trình `Cập nhật màu`: Task gồm 3 Sub-task (Kiến trúc sư gộp `houseColors` vào `layout.colors` → Dựng hình dựng lại → Kiểm định kiểm tra mục D).
- Modify: `agents/phan-tich/AGENTS.md` (thêm `spec.colors` và `furniture_notes`), `agents/kien-truc-su/AGENTS.md` (chép `colors` ở Sub-task Mái; Sub-task gộp bảng màu), `agents/kiem-dinh/AGENTS.md` (mục D), `agents/ceo/AGENTS.md` (khi chủ dự án báo đã lưu bảng màu thì giao PM).
- Modify: `C:\Users\ADMIN\AppData\Local\Temp\claude\...\scratchpad\remap-agents.mts`: thêm `noi-that` vào `MAP`. Nếu QLDA chưa có agent tên "Nội thất" thì tạo qua `POST /api/companies/{id}/agents`, với `adapterType` và `adapterConfig` chép từ Kiến trúc sư, `reportsTo` = id của PM, `role: "designer"`.

- [ ] **Bước 1:** import lại skill vào QLDA: `company import ../studio-nha-3d --target existing -C <QLDA> --include skills --collision replace --dry-run`. Xem trước chỉ có 2 skill thay đổi (`house-builder`, `kien-truc-nha-o`), rồi chạy thật với `--yes`.
- [ ] **Bước 2:** chạy `remap-agents.mts` → in ra `OK` cho cả 7 agent.
- [ ] **Bước 3:** chạy `verify-agents.mts` → Nội thất báo cáo PM, có skill `house-builder` và `kien-truc-nha-o`. Nếu agent mới chưa có tài khoản AI thì báo chủ dự án chọn trong giao diện.

### Task 7: Build lại Docker và kiểm tra thực tế

- [ ] **Bước 1:** `docker compose -f docker/docker-compose.quickstart.yml up -d --build` (chạy nền) → container chạy lại, `GET /api/health` trả 200.
- [ ] **Bước 2:** trong công ty STU, tạo task "Thử trình xem 3D" và đính kèm `model.glb` của `EXAMPLE` (có nội thất, có màu ghi đè). Mở file trên trình duyệt và kiểm tra:
  - Hiện đủ cây bộ phận.
  - Bấm vào mái thì chọn được mái; đổi màu "cho mọi Mái".
  - Lắp ráp chạy hết; tách rời được.
  - Lưu bảng màu tạo ra comment đúng định dạng; tải lại trang thì thấy nút "Áp dụng bảng màu đã lưu".
  - Console không có lỗi.
- [ ] **Bước 3:** gộp comment bảng màu vào `layout.colors` của `EXAMPLE`, dựng lại → màu trong `model.glb` mới khớp với lựa chọn.
