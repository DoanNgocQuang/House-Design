# Kích thước chuẩn nhà ở Việt Nam (dùng để giả định)

Các con số dưới đây là mức thông dụng, dùng cho bài tập. Đây không phải quy chuẩn pháp lý.

## Lô đất và tổng thể

| Loại nhà | Mặc định khi thiếu thông tin |
|---|---|
| Nhà phố (ống) | Rộng 4–5m, sâu 15–20m. Mặc định 5x20m |
| Biệt thự / nhà vườn | Lô 10x20m, nhà lùi vào 3m so với mặt tiền |
| Tầng cao | 3.3–3.6m. Mặc định 3.4m |
| Mái thái | `hip`, dốc 30–40°. Mặc định 35° |
| Mái ngói 2 mái | `gable`, dốc 30° |
| Mái bằng | `flat`, có lan can 0.8m |
| Mái lệch (hiện đại) | `shed`, dốc 8–15°, mặc định 10°; `slope_to` là phía nước chảy xuống (mặc định `back`) |
| Mái Nhật | `hip`, dốc thấp 20–25°, `overhang` 0.8–1m |
| Sân thượng | Phần tầng dưới lộ ra (không có tầng trên phủ) tự thành sân thượng có lan can 0.9m. Cần một cửa đi từ phòng tầng trên ra |
| Tầng hầm | Cao 2.8–3.2m, `floors[0].kind = "basement"`, vào bằng cầu thang |
| Tầng lửng | Cao 2.6–3m (mặc định 2.8), phủ 1/2–2/3 tầng dưới, phần còn lại là `void` thông tầng có lan can |
| Cầu thang chữ U | Ô rộng 2.2–2.6m, dài 2.8–3.6m; chân và đầu thang cùng ở một cạnh, nên đặt cạnh sảnh |
| Cầu thang chữ L | Ô từ 2.0 x 2.6m, vế rộng 0.9–1.1m; hợp với góc nhà |
| Hiên có cột | Sâu 1.8–3m, cột cách nhau tối đa 3m, `type: "porch"` |
| Giếng trời / thông tầng | Phòng `type: "void"`, rộng ít nhất 1.5m, diện tích 3–10m². Đặt chồng cùng toạ độ ở các tầng mà nó thông qua |

## Kiểu nhà (chọn trước khi giả định kích thước)

Chọn kiểu theo từ khoá trong yêu cầu, rồi theo lô đất. **Không mặc định mãi một kiểu**: nếu yêu cầu không nói rõ, chọn kiểu hợp với lô đất và nhu cầu, và ghi lý do vào `assumptions`.

| `house_type` | Khi nào chọn | Lô đất, số tầng mặc định | `shape` và mái thường gặp |
|---|---|---|---|
| `nha-ong` | "nhà ống", lô hẹp sâu, phố đông | 4x16m, 3–4 tầng | `chu-nhat` hoặc `giat-cap` (tầng trên cùng lùi làm sân thượng), mái `flat`; có `gieng-troi` giữa nhà |
| `nha-pho` | "nhà phố", lô 5–6m mặt tiền | 5x20m, 2–3 tầng | `chu-nhat`, mái `hip` hoặc `flat`, ban công mặt tiền |
| `biet-thu` | "biệt thự", lô từ 10m rộng | 12x20m, nhà 9x12m lùi 3m, 2–3 tầng | `chu-L` hoặc `chu-nhat`, mái `hip` (mái Thái/mái Nhật) |
| `nha-vuon` | "nhà vườn", "sân vườn", nông thôn | 15x25m, nhà lùi 4m, 1–2 tầng | `chu-L` hoặc `chu-U` ôm sân, mái `gable` hoặc `hip` |
| `nha-cap-4` | "cấp 4", "1 tầng", chi phí thấp | 8x20m, 1 tầng | `chu-nhat` hoặc `chu-L`, mái `gable` hoặc `hip` |
| `nha-hien-dai` | "hiện đại", "tối giản", "mái lệch" | 10x20m, 2 tầng | `giat-cap` hoặc `chu-L`, mái `shed` hoặc `flat`, có `san-thuong` |

## Phòng (diện tích tối thiểu và mặc định)

| Phòng | `type` | Tối thiểu | Mặc định |
|---|---|---|---|
| Phòng khách | living | 12m² | 15–20m² |
| Bếp + ăn | kitchen | 5m² | 12–20m² |
| Phòng ngủ | bedroom | 9m² | 12–16m², cạnh ngắn ≥ 2.8m |
| WC | wc | 3m² | 3–5m² (khoảng 1.8x2m) |
| Gara ô tô | garage | 15m² | rộng ≥ 3m, sâu ≥ 5.5m |
| Cầu thang | stairs | — | rộng 1–1.2m, dài 4–5m (thẳng, đặt sát một tường bên) |
| Phòng thờ | worship | — | 6–9m², thường ở tầng trên cùng |
| Sảnh / hành lang | hall | — | rộng ≥ 1m |
| Ban công / sân | balcony | — | sâu 1.2–2m |

## Cửa

| Loại | Kích thước |
|---|---|
| Cửa chính | rộng 1.2–1.6m. Nhà phố có gara thì dùng cửa gara rộng 2.8–3.2m, `head` 2.6m |
| Cửa phòng | rộng 0.8–0.9m |
| Cửa WC | rộng 0.7–0.8m |
| Cửa sổ | rộng 1.2–1.6m, mặc định sill 0.9m, head 2.1m |

## Sân vườn, hàng rào, cổng

| Hạng mục | Mặc định khi thiếu thông tin |
|---|---|
| Hàng rào | cao 1.6m (1.5–2m), rào cả 4 cạnh lô đất |
| Cổng ô tô | rộng 3–4m, ở mặt tiền, thẳng hàng với gara |
| Cổng đi bộ | rộng 1–1.2m |
| Sân trước | sâu 3–5m, lát gạch (`paving`); nhà lùi vào bằng chiều sâu sân trước |
| Lối đi bên hông | rộng 0.8–1.2m (`path`) |
| Vườn sau, khoảng lùi hai bên | thảm cỏ (`lawn`), có thể thêm cây, bồn hoa |

## Nguyên tắc xếp mặt bằng nhà phố

- Tầng 1, từ ngoài vào: gara/sân trước → phòng khách → cầu thang → bếp + ăn → WC / sân sau.
- Tầng trên: phòng ngủ chính ở mặt tiền, phòng ngủ phụ phía sau, WC gom về cùng một trục cho dễ đi ống nước.
- Cầu thang ở cùng một vị trí trên mọi tầng, nằm khoảng giữa nhà để chia đôi chiều sâu.
- Phòng ngủ và phòng khách nên có cửa sổ ra mặt tiền, mặt hậu hoặc giếng trời. Nhà phố thường không có cửa sổ ở hai bên hông.
