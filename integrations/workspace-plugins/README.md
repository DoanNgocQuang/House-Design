# Plugin cục bộ của Paperclip

Repo này giữ bản JavaScript của hai plugin đã được chỉnh trên bản Paperclip đang chạy.

| Phần | Nơi chỉnh |
| --- | --- |
| Bố cục Agent Office, tab riêng, toàn màn hình, đồng hồ và chế độ ánh sáng | `ui/src/components/AgentOfficeView.tsx`, `ui/src/pages/PluginPage.tsx` |
| Trang Agent Stats | `ui/src/pages/AgentStats.tsx`, `server/src/services/agent-stats.ts` |
| Agent Pixels 2026.807.2, gồm bản đồ, hình ảnh, góc nhìn 3D và phần phòng họp đã tùy chỉnh | `integrations/agent-pixels/source/` |
| Ánh sáng, trang trí bản đồ, tên phòng, màu nhãn và quy tắc nghỉ của agent | Các module `integrations/agent-pixels/office-*.mjs` |
| Telegram 0.8.1, gồm giao diện, worker và phần kết nối phòng chat đã chỉnh | `integrations/telegram/source/` |

Đây là bản JS lấy từ các plugin đã cài và dùng làm đầu vào build. Tên gói, phiên bản và ID manifest được giữ để Paperclip nhận ra đúng plugin. Giấy phép và thông tin tác giả có trong từng thư mục nguồn. Repo giữ code, bố cục và hình ảnh. Dữ liệu công ty, lịch sử chat, tài khoản, cấu hình và token vẫn do Paperclip quản lý riêng.

## Dựng từ mã nguồn

Chạy từ thư mục gốc của repo. Khi chạy ngoài Docker, hãy cài dependencies của repo trước để dựng SDK.

```sh
pnpm --filter @paperclipai/plugin-sdk build
node integrations/workspace-plugins/build.mjs
```

Lệnh tạo hai gói có thể cài bằng đường dẫn cục bộ trong **Instance Settings → Plugins → Install plugin**:

- Agent Pixels: `integrations/workspace-plugins/dist/agent-pixels`
- Telegram: `integrations/workspace-plugins/dist/telegram`

Dùng đường dẫn tuyệt đối mà **máy chủ Paperclip** nhìn thấy. Với Docker dựng từ repo, đường dẫn lần lượt là `/app/integrations/workspace-plugins/dist/agent-pixels` và `/app/integrations/workspace-plugins/dist/telegram`. Khi cài từ repo, giữ nguyên thư mục `dist` bên ngoài chứa cả hai gói và SDK để Telegram tìm được SDK lúc chạy.

Dockerfile dựng sẵn cả hai gói. Quickstart khôi phục các file từ repo vào các plugin đã cài khi tên gói, phiên bản và manifest khớp. Nếu dùng bộ dữ liệu mới hoặc đang cài một manifest khác, cài bằng đường dẫn cục bộ ở trên qua giao diện Paperclip. Các gói sinh ra trong `dist/` được dựng lại từ mã nguồn và Git bỏ qua thư mục đó.
