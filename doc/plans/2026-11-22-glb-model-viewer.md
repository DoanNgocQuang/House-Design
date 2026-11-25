# Trình xem mô hình 3D theo bộ phận (Studio Nhà 3D)

Ngày: 2026-11-22 · Trạng thái: chờ duyệt

## Mục đích

Bài tập lớn "Studio Nhà 3D": các agent trong Paperclip biến chữ hoặc ảnh thành mô hình nhà 3D. Chủ dự án muốn:

1. Nhà được dựng **theo từng bộ phận có tên** (sàn, tường, cửa, kính, cầu thang, mái).
2. **Chọn màu** cho từng bộ phận, hoặc cho cả một loại bộ phận, ngay trên giao diện.
3. Xem hiệu ứng **lắp ráp**: các bộ phận ghép dần lại thành ngôi nhà. Có thêm chế độ **tách rời** để nhìn vào trong.
4. **Lưu màu** đã chọn, để agent dựng lại `model.glb` đúng màu đó.
5. **Nội thất**: agent tự bố trí đồ (giường, tủ, sofa, bếp, bồn cầu...) theo loại phòng. Chủ dự án đổi màu và ẩn/hiện từng món trên trình xem; muốn đổi vị trí thì nhắn agent.

Hiện tại `model.glb` gộp các bộ phận theo vật liệu (5 khối), và giao diện Paperclip không xem được file `.glb` (chỉ hiện nút Download).

**Mục tiêu:** mở file `.glb` đính kèm của task là có trình xem 3D, với cây bộ phận, chọn màu, lắp ráp/tách rời, và lưu bảng màu thành comment.
**Không làm:** chỉnh sửa hình học hoặc kéo thả nội thất trên giao diện; texture; xuất ngược file GLB đã tô màu từ giao diện; xem file `.gltf` dạng nhiều file.
**Coi là thất bại nếu:** làm chậm các trang khác của Paperclip (Three.js phải được tải lười, chỉ khi mở file 3D), hoặc bảng màu đã lưu không áp dụng lại được sau khi dựng lại mô hình.

## Các cách đã cân nhắc

| Cách | Đánh đổi | Kết quả |
|---|---|---|
| **1. Trình xem có sẵn trong UI Paperclip (Three.js)** | Phải sửa code UI và thêm dependency `three`; có thêm chỗ xung đột khi kéo upstream | **Đã chọn**: lưu màu được, không bị giới hạn kích thước, mở ngay trong task |
| 2. Plugin Paperclip | Không đụng lõi, nhưng chưa chắc chèn được vào khung xem file đính kèm; làm lâu hơn | Loại |
| 3. Chỉ nâng cấp `viewer.html` | Không sửa Paperclip, nhưng sandbox chặn lưu màu và file phải ≤ 512 KB | Loại (vẫn giữ `viewer.html` làm phương án dự phòng) |

## Thiết kế

### A. `house_builder.py`: GLB theo bộ phận

- Cây node: `Nhà` → `Tầng 1..N`, `Mái`. Mỗi **bộ phận là một node có tên và mesh riêng**, ví dụ `T1 · Gara · Sàn`, `T1 · Tường mặt tiền (Gara)`, `T2 · Ngủ 1 · Kính cửa sổ`, `T1 · Cầu thang`.
- `extras` của mỗi node gồm:
  - `partId`: **ổn định** giữa các lần dựng lại nếu mặt bằng không đổi. Sinh từ tầng, phòng, loại và cạnh, ví dụ `t1-gara-san`, `t1-tuong-h-0-0-5`.
  - `category`: `floor | wall | door | glass | stairs | roof`.
  - `floor`, `room` (nếu có), và `order` (thứ tự lắp ráp).
- Tường: mỗi đoạn tường gộp (một cạnh liên tục trên một đường) là 1 bộ phận, gồm cả các mảnh quanh ô cửa.
- **Thêm cánh cửa** (loại `door`): một tấm mỏng trong mỗi ô cửa đi, kể cả cửa gara.
- **Màu** nằm trong `layout.json → colors`: `{"categories": {"roof": "#7a3b2e", ...}, "parts": {"t1-gara-san": "#cccccc"}}`. Thứ tự ưu tiên: màu riêng của bộ phận > màu theo loại > màu mặc định. GLB có một material cho mỗi màu thực sự dùng tới.
- `viewer.html` giữ nguyên tính năng, chỉ đọc thêm màu theo loại từ `colors`.
- Selftest bổ sung: kiểm tra số node bộ phận, `partId` không trùng, màu ghi đè được áp đúng, và dựng hai lần ra cùng `partId`.

### A2. Nội thất (thư viện CC0)

- **Thư viện:** bộ Kenney Furniture Kit (CC0, ~140 file, bản 2018). Tải về sau khi chủ dự án đồng ý, và chép bộ đã chọn lọc vào `skills/house-builder/assets/furniture/` kèm file giấy phép. Nếu bộ chỉ có OBJ + MTL, script đọc OBJ trực tiếp bằng thư viện chuẩn; màu lấy từ `Kd` trong MTL.
- **`assets/furniture/catalog.json`:** ánh xạ mã món đồ (ví dụ `giuong-doi`, `sofa-3`, `tu-bep`, `bon-cau`) sang file OBJ, kích thước chiếm chỗ `w × d` (mét), các loại phòng phù hợp, khoảng trống cần chừa phía trước, và tỉ lệ quy đổi về mét.
- **`layout.json → floors[].furniture`:** `[{id, item, room, x, y, rotation: 0|90|180|270, color?}]`, toạ độ là tâm món đồ.
- **Validate thêm:** món đồ nằm trong phòng của nó; các món không chồng lên nhau; không đặt trên ô cầu thang; không chắn ô cửa đi (chừa 0.8m phía trong mỗi cửa); `item` có trong catalog. Thiếu đồ thiết yếu (phòng ngủ không có giường, bếp không có tủ bếp, WC không có bồn cầu) chỉ là **cảnh báo**.
- **Dựng:** mỗi món là một bộ phận `furniture` có `partId` riêng (`t2-ngu1-giuong-doi-1`), nằm dưới node tầng của nó. Màu ghi đè áp lên toàn bộ món; nếu không ghi đè thì giữ màu gốc của thư viện.
- `viewer.html`: có hiện nội thất. Nếu file vượt 450 KB thì tăng kích thước ô chia và không chia nhỏ mặt của đồ nội thất, để luôn dưới 512 KB.
- Lệnh mới `catalog` in danh sách món đồ để agent tra cứu.

### B. UI Paperclip: `ModelAttachmentPreview`

- `ui/src/lib/model-preview.ts`: `isModelAttachment()` nhận ra file theo `.glb` hoặc `model/gltf-binary`; hàm thuần dựng bảng màu và comment; hàm đọc ngược bảng màu từ comment.
- `TaskAttachmentPanel.tsx`: nếu là file 3D thì hiển thị `ModelAttachmentPreview`, **tải lười** bằng `React.lazy` và dynamic import, nên chunk `three` chỉ tải khi mở file 3D. Giới hạn kích thước file khi xem: 50 MB.
- `ModelAttachmentPreview.tsx`: dùng Three.js, `GLTFLoader` và `OrbitControls`, tải file từ `/api/attachments/:id/content`.
  - **Khung 3D:** xoay, phóng to, kéo; bấm vào bộ phận để chọn (raycast), bộ phận được chọn có viền sáng.
  - **Bảng bên:**
    - Danh sách loại bộ phận, mỗi loại có ô màu và nút ẩn/hiện.
    - Cây Tầng → bộ phận để bấm chọn.
    - Ô chọn màu `<input type="color">`, kèm tuỳ chọn "Áp dụng cho mọi [loại]".
  - **Nút "Lắp ráp":** ẩn hết, rồi từng bộ phận rơi vào vị trí theo `order` (sàn → tường → cửa và kính → cầu thang → nội thất → tầng kế tiếp → mái), khoảng 8 giây.
  - Loại "Nội thất" có trong danh sách loại bộ phận (ẩn/hiện, đổi màu cả loại); từng món chọn được trong cây Tầng → Phòng → món đồ. Tôn trọng `prefers-reduced-motion`: khi bật thì hiện ngay, không chạy hiệu ứng.
  - **Nút "Tách rời"** (bật/tắt): mỗi tầng nâng lên một khoảng, mái nâng cao hơn.
  - **Nút "Lưu bảng màu":** gọi `issuesApi.addComment(issueId, body)`. Comment gồm tên file và một khối ` ```json {"houseColors": {...}} ``` `. Chỉ chứa các màu đã đổi so với file gốc.
  - Khi mở file, nếu trong task đã có comment bảng màu mới nhất cho đúng tên file đó, hiện nút "Áp dụng bảng màu đã lưu" để xem trước.
- Màu của **khung giao diện** dùng token trong `ui/src/index.css` (`--background`, `--border`...) theo `DESIGN.md`. Màu của **bộ phận nhà** là dữ liệu của file, không phải token giao diện.
- Dependency: `three` và `@types/three` trong `ui/package.json`. Cập nhật `pnpm-lock.yaml`, vì Dockerfile cài bằng `--frozen-lockfile`.

### C. Agent và skill

- `spec.schema.json` và `layout.schema.json`: thêm `colors`.
- **Phân tích:** lấy màu từ yêu cầu ("mái xanh rêu") đổi thành mã hex, ghi vào `spec.colors`.
- **Kiến trúc sư:** chép `spec.colors` sang `layout.colors` ở Sub-task Mái.
- **Đổi màu:** chủ dự án bấm "Lưu bảng màu" rồi nhắn CEO. CEO giao PM. PM tạo Task `Cập nhật màu` trong Epic cũ, gồm các Sub-task:
  1. Kiến trúc sư gộp `houseColors` vào `layout.colors`.
  2. Dựng hình dựng lại.
  3. Kiểm định kiểm tra màu.
- `checklist.md` thêm mục: màu trong mô hình khớp với yêu cầu hoặc bảng màu đã lưu; mỗi phòng có đủ đồ thiết yếu; đồ không chắn cửa hay cầu thang.
- **Agent mới "Nội thất"** (role `designer`, báo cáo PM). Tôi tạo agent này qua API, chép cấu hình adapter và model của Kiến trúc sư (Claude Opus 5.5). Nếu tài khoản AI không được chép theo, chủ dự án chọn tài khoản trong giao diện (đề xuất Claude 2). Skill: `kien-truc-nha-o`, `house-builder`.
- **Cây việc của PM:** thêm Task giai đoạn `Thiết kế nội thất` sau Thiết kế mặt bằng, gồm mỗi tầng 1 Sub-task (đặt đồ cho các phòng của tầng đó) và 1 Sub-task validate. Dựng hình bị chặn cho tới khi Nội thất xong. Yêu cầu "không cần nội thất" thì bỏ giai đoạn này.
- `kien-truc-nha-o/references/noi-that-chuan.md`: bộ đồ mặc định cho từng loại phòng, khoảng trống tối thiểu (lối đi ≥ 0.6m, trước tủ ≥ 0.8m), và quy tắc đặt đồ (giường kê đầu vào tường, không đặt trước cửa sổ thấp...).
- **Phân tích:** ghi các yêu cầu về nội thất ("phòng khách sofa chữ L") vào `spec.json → rooms[].furniture_notes`.
- `house-builder/SKILL.md`: mô tả cây bộ phận và trường `colors`.

### D. Triển khai

UI chạy trong image Docker, nên phải **build lại image** (`docker compose -f docker/docker-compose.quickstart.yml up -d --build`). Việc này mất khá lâu, và sẽ khởi động lại Paperclip.

## Kiểm tra

- `house_builder.py selftest`, gồm cả nhà mẫu có nội thất: đọc OBJ, đồ nằm trong phòng, phát hiện đồ chắn cửa, `viewer.html` < 512 KB.
- Vitest: các hàm thuần trong `model-preview.ts` (nhận diện file, dựng và đọc bảng màu); `TaskAttachmentPanel` hiển thị trình xem 3D cho file `.glb`.
- Typecheck UI.
- Thử thật trên trình duyệt: upload `model.glb` của nhà mẫu vào một task của công ty STU. Kiểm tra: mở được, chọn bộ phận, đổi màu, lắp ráp, tách rời, và lưu bảng màu ra comment.

## Để người làm tự quyết

Kích thước bảng bên, khoảng nâng khi tách rời, tốc độ hiệu ứng, cách viết tên bộ phận, và màu mặc định của từng loại.
