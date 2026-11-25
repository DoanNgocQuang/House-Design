---
name: Studio Nhà 3D
slug: studio-nha-3d
description: Công ty AI biến mô tả bằng chữ hoặc ảnh thành mô hình nhà 3D, qua dây chuyền nhiều agent phối hợp.
schema: agentcompanies/v1
version: 1.0.0
goals:
  - Nhận yêu cầu nhà ở bằng chữ hoặc ảnh và bàn giao mô hình 3D (<ten-san-pham>.glb, mặt bằng, phối cảnh)
  - Mỗi bước do đúng một agent chuyên trách, bàn giao cho nhau bằng file JSON có schema cố định
---

# Studio Nhà 3D

Dây chuyền xử lý một yêu cầu:

```
Chủ dự án → CEO (tiếp nhận) → PM (lập kế hoạch, chia việc)
              → Phân tích (spec.json) → Kiến trúc sư (layout.json) → Dựng hình (<ten-san-pham>.glb) → Kiểm định
```

- CEO chỉ tiếp nhận yêu cầu và báo kết quả. PM là người duy nhất chia Epic, Task và Sub-task.
- Mỗi yêu cầu tương ứng đúng 1 Epic. Bên trong, PM tự chia số Task và Sub-task tuỳ độ phức tạp, càng chi tiết càng tốt, có các bước xem chéo giữa agent và chạy song song khi không đụng cùng file.
- Skill dùng chung: `kien-truc-nha-o` (schema, kích thước chuẩn, checklist) và `house-builder` (script dựng mô hình).
