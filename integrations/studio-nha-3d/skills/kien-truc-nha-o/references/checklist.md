# Checklist nghiệm thu mô hình nhà

Kiểm định đối chiếu với **yêu cầu gốc** (task của CEO) và **`spec.json`**, sau đó ghi kết quả từng mục: Đạt / Không đạt / Không áp dụng, kèm bằng chứng.

## A. Tự động (chạy script)

- [ ] `house_builder.py validate layout.json` trả về `ok: true`.
- [ ] Đủ 4 file đính kèm: `<ten-san-pham>.glb`, `iso.svg`, `plan.svg`, `render.png` (thiếu `render.png` chỉ chấp nhận khi Dựng hình đã ghi rõ máy chưa cài Blender).

## B. Đúng yêu cầu

- [ ] Số tầng đúng như yêu cầu.
- [ ] Đủ số phòng theo từng loại (đếm trong `stats.rooms` của validate), đặc biệt là số phòng ngủ và WC.
- [ ] Kích thước lô đất đúng như yêu cầu.
- [ ] Kiểu mái đúng ("mái thái" → `hip`, "mái bằng" → `flat`, "2 mái / mái ngói" → `gable`, "mái lệch" → `shed`).
- [ ] Kiểu nhà, hình khối và hạng mục khớp `spec.json` (`house_type`, `shape`, `features`): ví dụ có `san-thuong` thì tầng trên phải lùi và có cửa ra; có `gieng-troi` thì có phòng `void`.
- [ ] Các yêu cầu đặc biệt đều có mặt (gara, phòng thờ, ban công...), nằm đúng tầng.
- [ ] Mọi giả định đều được ghi trong `spec.json → assumptions`, không có giả định nào trái với yêu cầu gốc.

## C. Hợp lý về kiến trúc (nhìn `plan.svg`, `iso.svg` và `render.png`)

- [ ] Có cửa chính ở mặt tiền. Đi được từ cửa chính tới mọi phòng mà không phải xuyên qua phòng ngủ.
- [ ] Cầu thang thẳng hàng giữa các tầng, và đi được từ khu chung (khách / sảnh).
- [ ] Chân cầu thang (tầng dưới) và đầu trên (tầng trên) không bị tường chặn: mở `<ten>.glb`, chế độ Đi dạo, đi thử từ tầng 1 lên tầng trên.
- [ ] Không có cảnh báo diện tích nào chưa được giải thích.
- [ ] Ảnh phối cảnh nhìn ra là một ngôi nhà: không thiếu tường, mái phủ kín tầng trên.

## C2. Sân vườn và hàng rào (nếu yêu cầu có)

- [ ] Có đủ các hạng mục được yêu cầu (sân trước, vườn, hàng rào, cổng...), đúng vị trí.
- [ ] Cổng nằm ở mặt tiền và thẳng với gara hoặc lối vào; hàng rào không chắn cửa chính.
- [ ] Không có khu sân vườn hay cây nào đè lên nhà (validate không báo lỗi `de len nha`, `nam trong nha`).

## D. Màu và nội thất

- [ ] Màu trong mô hình khớp với yêu cầu (`spec.json → colors`) hoặc với bảng màu chủ dự án đã lưu (comment "Bảng màu cho ..." trên task). Không có màu nào bị áp sai bộ phận.
- [ ] Nếu không có ghi "không cần nội thất": mỗi phòng có đủ đồ bắt buộc theo `references/noi-that-chuan.md`. Validate không còn cảnh báo "chua co ...", hoặc cảnh báo đó đã được giải thích.
- [ ] Đồ không chắn cửa đi hay cầu thang, và không có lỗi `chan cua` hoặc `chong len`.
- [ ] Không phòng nào trống, không có cảnh báo `can it nhat N mon do` (trừ phòng quá nhỏ có giải thích).
- [ ] Không có cửa đứng lẻ giữa phòng thông nhau, và không cửa nào ở tầng trên mở vào giếng trời hay khoảng không.
- [ ] Không có cửa, cửa sổ, vách kính ở chỗ không có tường (mép ngoài ban công, lô gia, hiên, cạnh thông).
- [ ] Từ cửa chính tới được mọi phòng tầng 1, từ đầu thang tới được mọi phòng tầng trên, không băng qua ô thang và không vòng ra sân.
- [ ] Không có cửa ở cạnh bên ô thang; không phải đi xuyên phòng ngủ, WC, kho, gara để vào phòng khác.
- [ ] Phòng khách giáp cửa chính hoặc sảnh đón; ban công không bị kẹp giữa hai phòng; sảnh + hành lang dưới 25% sàn.
- [ ] Không có cột trước cửa chính, cột dính tường; kiểu cột hợp phong cách mặt tiền.
- [ ] Không có cửa thừa: hai phòng kề nhau chỉ cần một cửa, trừ khi chủ dự án yêu cầu thêm.
- [ ] Phòng ngủ, WC, kho, phòng thờ, giặt, gara có đủ tường bốn phía; chỉ khách, bếp, ăn, sảnh, cầu thang được để thông nhau.
- [ ] Nội thất có nhiều màu theo từng món; không có `colors.categories.furniture` nếu chủ dự án không tự chọn.
- [ ] Mỗi task không có hai file trùng tên.
- [ ] Nhìn `iso.svg` hoặc mở `<ten-san-pham>.glb` trong task: đồ quay đúng hướng (sofa quay về phía tivi, ghế quay vào bàn, giường kê đầu vào tường).

## Kết luận

- **Đạt:** mọi mục B đều Đạt, và mục C không có lỗi nghiêm trọng.
- **Không đạt:** nêu mục sai, file sai, agent chịu trách nhiệm (Phân tích nếu sai `spec.json`; Kiến trúc sư nếu sai mặt bằng; Dựng hình nếu sai file hoặc thiếu file). Mở lại đúng task của agent đó, kèm comment lỗi cụ thể.
