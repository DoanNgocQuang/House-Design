---
name: kien-truc-nha-o
description: >
  Kiến thức nghề dùng chung cho studio nhà 3D: schema spec.json và layout.json,
  kích thước chuẩn nhà ở Việt Nam để giả định khi yêu cầu thiếu thông tin, và
  checklist kiểm định. Dùng khi phân tích yêu cầu, xếp mặt bằng hoặc nghiệm thu mô hình.
---

# Kiến trúc nhà ở

Mọi agent trong studio dùng chung các nguồn sau, để cùng hiểu dữ liệu và cùng một chuẩn:

| File | Nội dung | Ai dùng |
|---|---|---|
| `schemas/spec.schema.json` | Định dạng `spec.json`: yêu cầu đã chuẩn hoá | Phân tích (viết), Kiến trúc sư (đọc), Kiểm định (đối chiếu) |
| `schemas/layout.schema.json` | Định dạng `layout.json`: mặt bằng có toạ độ | Kiến trúc sư (viết), Dựng hình (đọc) |
| `references/kich-thuoc-chuan.md` | Kích thước chuẩn và cách giả định khi thiếu thông tin | Phân tích, Kiến trúc sư |
| `references/mau-mat-bang.md` | Quy tắc bố trí, lỗi hay gặp và mặt bằng mẫu để học theo | Kiến trúc sư, Kiểm định |
| `references/noi-that-chuan.md` | Bộ đồ mặc định theo phòng, khoảng trống, quy tắc đặt đồ | Nội thất, Kiểm định |
| `references/checklist.md` | Checklist nghiệm thu (A–D, gồm màu và nội thất) | Kiểm định, và các agent khác tự kiểm trước khi bàn giao |

## Quy tắc chung

1. **Chỉ truyền dữ liệu bằng file JSON đúng schema**, đính kèm vào task. Không mô tả bằng văn bản tự do thay cho file.
2. **Không tự bịa con số mà không ghi lại.** Mọi giá trị không có trong yêu cầu gốc phải nằm trong `spec.json → assumptions`, kèm lý do (ví dụ "Giả định tầng cao 3.4m theo chuẩn nhà phố").
3. **Đầu vào là ảnh:** mô tả những gì thấy được (số tầng, kiểu mái, số cửa sổ, chiều rộng ước tính qua số cửa) vào `source_notes`. Mọi kích thước suy ra từ ảnh đều là giả định.
4. **Gặp mâu thuẫn không tự giải quyết được** (ví dụ 5 phòng ngủ trên lô 4x10m) thì không đoán: ghi vào task, chuyển trạng thái blocked và báo PM.
