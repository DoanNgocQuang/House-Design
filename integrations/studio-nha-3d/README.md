# Studio Nhà 3D: công ty AI dựng mô hình nhà trên Paperclip

Bài tập lớn: nhiều agent trong [Paperclip](https://github.com/paperclipai/paperclip) phối hợp với nhau để biến **mô tả bằng chữ hoặc ảnh** thành **mô hình nhà 3D**.

## Tổ chức

```
CEO (tiếp nhận yêu cầu)                          codex
└── PM (lập kế hoạch, chia Epic/Task/Sub-task)   codex
    ├── Phân tích     chữ/ảnh → spec.json        claude · Opus 5.5
    ├── Kiến trúc sư  spec → layout.json         claude · Opus 5.5
    ├── Nội thất      đặt đồ vào layout.json     claude · Opus 5.5
    ├── Dựng hình     layout → <ten-san-pham>.glb, plan.svg, iso.svg   codex
    └── Kiểm định     checklist → Đạt / sửa      claude · Sonnet 5.5
```

Cây việc có 4 cấp: Yêu cầu (giao CEO) → Epic (CEO giao PM) → Task → Sub-task. PM chia chi tiết nhất có thể, thêm các Sub-task xem chéo giữa agent và cho chạy song song những việc không đụng cùng file. Kiểm định trả về sửa tối đa 2 vòng.

## Thư mục

| Đường dẫn | Nội dung |
|---|---|
| `COMPANY.md`, `agents/*/AGENTS.md` | Gói công ty theo chuẩn agentcompanies/v1 |
| `.paperclip.yaml` | Adapter và model của từng agent |
| `skills/house-builder/` | Script Python (chỉ dùng thư viện chuẩn): validate và build ra `<ten-san-pham>.glb`, `plan.svg`, `iso.svg` |
| `skills/kien-truc-nha-o/` | Schema `spec.json`/`layout.json`, kích thước chuẩn nhà VN, checklist nghiệm thu |

## Thử script trên máy

```sh
python skills/house-builder/scripts/house_builder.py selftest
python skills/house-builder/scripts/house_builder.py example > layout.json
python skills/house-builder/scripts/house_builder.py build layout.json --out ket-qua
```

Mở `<ten-san-pham>.glb` trong task Paperclip (trình xem 3D có sẵn), hoặc bằng 3D Viewer của Windows.

## Chạy bằng Docker (không cần import tay)

Gói công ty này nằm trong repo Paperclip và được đóng sẵn vào Docker image.

1. Từ thư mục `paperclip/docker`, tạo file `.env` có `BETTER_AUTH_SECRET=<chuỗi ngẫu nhiên>`, rồi chạy:
   ```sh
   docker compose -f docker-compose.quickstart.yml up -d --build
   ```
2. Mở http://localhost:3100 và tạo tài khoản quản trị đầu tiên. Công ty **Studio Nhà 3D** tự được tạo, gồm đủ 7 agent, hướng dẫn và skill. Plugin Agent Office và Telegram cũng được cài sẵn.
3. Trong công ty, mở **Apps** và đăng nhập tài khoản Claude và Codex.
4. Trong cài đặt của từng agent, chọn tài khoản AI cho agent đó.
5. Tạo một project (ví dụ "Thiết kế nhà"), rồi giao yêu cầu cho CEO trong project đó. File agent làm ra hiện ở tab **Files** của project.

Công ty chỉ được tạo **một lần** cho mỗi bộ dữ liệu. File đánh dấu là `instances/default/starter-company.json` trong thư mục dữ liệu, xoá nó thì lần khởi động sau sẽ tạo lại. Muốn tắt tính năng này, đặt `PAPERCLIP_STARTER_COMPANY_DIR=` (rỗng).

## Import tay vào một Paperclip khác

```sh
pnpm paperclipai company import integrations/studio-nha-3d --dry-run
pnpm paperclipai company import integrations/studio-nha-3d
```

## Giới hạn

Mô hình gồm khối hộp, mái lăng trụ, nội thất từ thư viện Kenney (CC0) và sân vườn; chưa có ban công đua ra hay mái lệch. Xem 3D bằng trình xem có sẵn trong Paperclip (chất liệu, bóng nắng, đo, đi dạo bên trong).
