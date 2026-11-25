---
name: chon-kieu-nha
description: >
  Phiếu câu hỏi chi tiết để CEO hỏi chủ dự án khi yêu cầu còn chung chung
  (chưa rõ kiểu nhà, kiểu mái, số tầng hoặc lô đất). Dùng trước khi tạo Epic cho PM.
---

# Hỏi chủ dự án khi yêu cầu chung chung

## Khi nào dùng

Yêu cầu của chủ dự án **thiếu từ hai thứ trở lên** trong bốn nhóm sau thì hỏi trước khi giao PM. Thiếu một thứ thì không cần hỏi: để Phân tích tự giả định.

1. Kiểu nhà.
2. Kiểu mái.
3. Số tầng và số phòng ngủ.
4. Lô đất và sân vườn.

Ví dụ "thiết kế cho tôi một ngôi nhà đẹp" thiếu cả bốn nhóm, nên phải hỏi. Còn "nhà phố 3 tầng 5x20m mái Thái, 4 phòng ngủ" đã đủ, nên giao PM luôn.

## Cách hỏi (một lượt chạy)

1. Tạo câu hỏi bằng `POST /api/issues/{issueId}/interactions`, dùng nguyên `questions.json` của skill này:
   - thay `{issueId}` trong `idempotencyKey`;
   - giữ nguyên `id` của câu hỏi và lựa chọn, vì Phân tích đọc theo các `id` này;
   - không gửi ảnh mẫu, vì mô tả trong từng lựa chọn đã đủ để chủ dự án hình dung.
2. Comment một câu ngắn cho chủ dự án, ví dụ "Anh/chị trả lời giúp em phiếu bên dưới để studio thiết kế đúng ý".
3. Kiểm tra interaction đã lưu và đang chờ. Chuyển task yêu cầu sang `in_review` (giữ nguyên người được giao), rồi kết thúc lượt chạy. **Chưa tạo Epic.**

## Khi chủ dự án đã trả lời

Bạn được đánh thức lại. Đọc kết quả interaction, rồi tạo Epic giao PM như bình thường. Trong mô tả Epic thêm mục **"Lựa chọn của chủ dự án"**, ghi đúng mã và tên:

```
Lựa chọn của chủ dự án:
- Kiểu nhà: biet-thu-mai-nhat (Biệt thự mái Nhật chữ L)
- Kiểu mái: mai-nhat
- Quy mô: 2 tầng, 3–4 phòng ngủ
- Lô đất: lo-vua; sân vườn: san-vuon, hang-rao, gara
- Ghi thêm của chủ dự án: <nguyên văn nếu có>
```

Câu nào chủ dự án chọn "Để studio tự chọn" thì ghi "studio tự chọn", để Phân tích giả định. Câu trả lời tự ghi (ô nhập thêm) thì chép nguyên văn.

## Kiểu nhà

| Mã (`option id`) | Tên | Gợi ý lô đất, số tầng | `house_type` / `style` / mái |
|---|---|---|---|
| `nha-pho-mai-thai` | Nhà phố mái Thái | 5x20m, 2–3 tầng | `nha-pho` / basic / `hip` |
| `nha-ong-san-thuong` | Nhà ống có sân thượng | 4–5 x 15–18m, 3–4 tầng | `nha-ong` / minimal / `flat` |
| `nha-hien-dai-mai-lech` | Nhà hiện đại mái lệch | 10–14 x 20m, 2 tầng | `nha-hien-dai` / modern / `shed` |
| `biet-thu-mai-nhat` | Biệt thự mái Nhật chữ L | 12–16 x 20m, 2 tầng | `biet-thu` / minimal / `hip` dốc thấp |
| `biet-thu-tan-co-dien` | Biệt thự tân cổ điển mái mansard | 9–12 x 24m, 2–3 tầng | `biet-thu` / classic / `mansard` |
| `nha-indochine` | Nhà Indochine mái chồng cấp | 9–12 x 24m, 2 tầng | `khac` / indochine / `tiered` |
| `nha-vuon-chu-u` | Nhà vườn chữ U ôm sân | 16 x 22m trở lên, 1 tầng | `nha-vuon` / indochine / `gable` |
| `nha-cap-4-chu-l` | Nhà cấp 4 chữ L | 10–12 x 20m, 1 tầng | `nha-cap-4` / basic / `hip` |

Mỗi kiểu có nhà mẫu đầy đủ toạ độ: `python3 scripts/house_builder.py example --type <mã>` của skill `house-builder`.

## Kiểu mái

| Mã | Tên | `roof` |
|---|---|---|
| `mai-thai` | Mái Thái | `hip`, dốc 35° |
| `mai-nhat` | Mái Nhật | `hip`, dốc 22°, chìa 1m |
| `mai-ngoi-2-mai` | Mái ngói 2 mái | `gable`, dốc 30° |
| `mai-bang` | Mái bằng | `flat` |
| `mai-lech` | Mái lệch hiện đại | `shed`, dốc 10° |
| `mai-mansard` | Mái mansard (Pháp) | `mansard` |
| `mai-chong-cap` | Mái chồng 2 cấp | `tiered`, dốc 30° |
