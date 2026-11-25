# Quy chuẩn bố trí nội thất

Mã món đồ, kích thước thật và loại phòng phù hợp: chạy `python3 scripts/house_builder.py catalog` của skill `house-builder`.

## Bộ đồ mặc định theo loại phòng

Dùng bộ đồ này khi chủ dự án không nêu yêu cầu riêng. Nếu `spec.json → rooms[].furniture_notes` có ghi thì làm theo ghi chú đó.

**Không phòng nào được để trống.** Phòng nào cũng phải có đồ đúng công dụng, chỉ trừ ô cầu thang, giếng trời, hành lang và ban công hẹp dưới 1.4m. Bắt đầu bằng lệnh `furnish` (xếp tự động đủ đồ và hợp lệ), rồi chỉnh lại theo ý chủ dự án. `validate` cảnh báo phòng nào thiếu so với số món tối thiểu theo diện tích.

| Phòng | Bắt buộc | Nên có (nếu đủ chỗ) |
|---|---|---|
| Phòng ngủ chính (≥ 14 m²) | `giuong-doi` + `tu-dau-giuong` 2 bên + `tu-quan-ao` | `ban-lam-viec` + `ghe-lam-viec`, `ke-tivi` + `tivi`, `tham`, `den-cay`, `cay-canh` (ít nhất 5 món) |
| Phòng ngủ phụ (9–14 m²) | `giuong-doi` hoặc `giuong-don`, `tu-dau-giuong`, `tu-quan-ao` | `ban-lam-viec` + `ghe-lam-viec`, `den-cay` (ít nhất 4 món) |
| Phòng khách | `sofa-3` (hoặc `sofa-dai` nếu cạnh ngắn ≥ 3.5 m) **đối diện** `ke-tivi` + `tivi`, cách nhau 2–3.5 m, `ban-tra` + `tham` ở giữa | `ghe-thu-gian`, `cay-canh` ở góc, `den-cay`, `ke-sach` (5 món từ 10 m², 7 món từ 16 m², 9 món từ 24 m²) |
| Bếp + ăn | Dãy tủ dọc một tường gồm `tu-bep`, `bep-nau`, `bon-rua-bat` và `tu-lanh` | `tu-bep-tren` treo phía trên dãy tủ, `ban-an` + 2–6 `ghe` |
| WC | `bon-cau` | `lavabo` hoặc `tu-lavabo`, `guong`; `voi-sen` nếu WC ≥ 3.5 m² |
| Phòng ăn riêng | `ban-an` + 4–6 `ghe` | `cay-canh`, `ke-tivi` |
| Phòng thờ | `ban-tho` sát tường | `cay-canh` hai bên |
| Phòng giặt | `may-giat`, `bon-rua-bat` | `ke-sach` (tủ chứa), `cay-canh` |
| Kho, phòng thay đồ | `ke-sach` hoặc `tu-quan-ao` sát tường | `guong` |
| Gara | `xe-oto` ở giữa, đầu xe quay ra cổng | — |
| Sảnh (≥ 5 m², rộng ≥ 1.4 m) | `cay-canh` | `den-cay`, `ghe-thu-gian`, `guong` |
| Ban công, lô gia, hiên, sân thượng | `cay-canh` ở các góc | `ghe-thu-gian` + `ban-tra` khi từ 9 m² |
| Ô cầu thang, giếng trời, hành lang hẹp | Không đặt đồ | — |

## Khoảng trống tối thiểu

- Lối đi chính giữa các món đồ: **≥ 0.6 m**.
- Trước tủ quần áo, tủ bếp, tủ lạnh: **≥ 0.8 m**, để mở được cánh.
- Hai bên giường đôi: **≥ 0.6 m** ở ít nhất một bên; tốt nhất là cả hai bên.
- Trước mỗi cửa đi: **0.8 m** để trống ở cả hai phía. Script sẽ báo lỗi `chan cua` nếu vi phạm.
- Ghế ăn: lùi ra khỏi mép bàn 0.6 m.

## Quy tắc đặt đồ

- Toạ độ `(x, y)` là **tâm** của món đồ. Muốn đặt sát tường thì lấy toạ độ tường cộng hoặc trừ nửa chiều sâu, cộng thêm 0.02 m.
- `rotation` là hướng mà mặt trước của món đồ nhìn ra: `0` nhìn ra mặt tiền (y nhỏ), `90` nhìn sang phải (+x), `180` nhìn về phía sau, `270` nhìn sang trái. Khi `rotation` là 90 hoặc 270 thì bề rộng và chiều sâu đổi chỗ cho nhau.
- Giường kê đầu vào tường, không kê đầu giường dưới cửa sổ. Sofa kê lưng vào tường và quay về phía kệ tivi.
- Tủ treo, tivi, gương và lò vi sóng là đồ `stack` (đặt trên cao hoặc trên một món khác): đặt cùng toạ độ với món bên dưới. Script không kiểm tra chồng lấn cho các món này.
- Không đặt đồ trong ô cầu thang, và không chắn ô cửa sổ thấp bằng tủ cao.
- **Màu đồ:** giữ màu riêng có sẵn của từng món, không sơn cả nhà một màu. Chỉ đặt `color` cho món chủ dự án nêu màu.
- **Trải đồ khắp phòng, không dồn một góc.** Đồ lớn sát tường, bàn trà và bàn ăn ở giữa, còn chỗ đi lại.
- Sau khi xếp, mở `plan.svg` để xem: mỗi món là một ô vuông, vạch đậm là mặt trước của món đó. Giường phải có lối đi bên cạnh, sofa và ghế phải quay vào bàn trà hoặc tivi.
