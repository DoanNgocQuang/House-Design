---
name: house-builder
description: >
  Kiểm tra layout.json và dựng mô hình nhà 3D theo từng bộ phận có tên (sàn, tường, cửa, kính,
  cầu thang, mái, nội thất), xuất <ten-san-pham>.glb, plan.svg, iso.svg và ảnh phối cảnh thật render.png (Blender) bằng một script
  Python chỉ dùng thư viện chuẩn. Dùng khi cần validate mặt bằng hoặc nội thất, tra catalog
  nội thất, dựng mô hình, áp bảng màu, hoặc lấy ảnh render để kiểm định.
---

# House Builder

Script: `scripts/house_builder.py` (Python 3, không cần cài thêm gói nào). Thư viện nội thất nằm ở `assets/furniture/`: bộ Kenney Furniture Kit, giấy phép CC0 (xem `License.txt`).

## Lệnh

```sh
python3 scripts/house_builder.py example                 # in một layout.json mẫu (có nội thất) đúng định dạng
python3 scripts/house_builder.py example-site            # layout mẫu có sân vườn, hàng rào, cổng, cây
python3 scripts/house_builder.py example-modern          # nhà chữ L, mái lệch, sân thượng, giếng trời
python3 scripts/house_builder.py catalog                 # danh sách nội thất: mã, tên, kích thước, loại phòng
python3 scripts/house_builder.py validate layout.json    # kiểm tra, in JSON {ok, errors, warnings, stats}
python3 scripts/house_builder.py build layout.json --out ket-qua/
python3 scripts/house_builder.py selftest                # tự kiểm tra script
```

- `validate` thoát với mã 1 nếu có `errors`. Phải sửa hết lỗi trước khi bàn giao.
  - **Lỗi về bố trí:** không đi tới được một phòng. Tầng 1 tính từ cửa chính; tầng trên tính từ cầu thang. Hai phòng chỉ thông nhau khi có cửa đi nằm trên tường chung, hoặc khi hành lang/cầu thang giáp trực tiếp phòng khách, bếp, phòng ăn, hành lang khác (cạnh chung ≥ 0.8m).
  - `warnings` gồm: diện tích dưới chuẩn, phòng quá hẹp (cạnh ngắn dưới mức tối thiểu), phòng dài hẹp (tỉ lệ dài/rộng quá lớn), phòng ngủ hoặc phòng khách không có cửa sổ, khoảng trống trong khung nhà không thuộc phòng nào, phòng tầng trên nằm ngoài tầng dưới (trừ ban công), và phòng thiếu đồ thiết yếu. Với mỗi cảnh báo: hoặc sửa, hoặc ghi lý do vào task.
- `build` tự chạy `validate` trước. Có lỗi thì không xuất file.

## Đầu ra của `build`

| File | Dùng để |
|---|---|
| `<ten-san-pham>.glb` | Mô hình 3D chuẩn glTF, gồm **cây bộ phận có tên**. Mở ngay trong task Paperclip (trình xem 3D: chọn bộ phận, đổi màu, lắp ráp, tách rời), hoặc bằng 3D Viewer của Windows hay Blender |
| `iso.svg` | Ảnh phối cảnh nhanh (vẽ phẳng), dùng để tự xem và kiểm định |
| `render.png` | **Ảnh phối cảnh thật**: lệnh riêng `render <file.glb> --out render.png`, dùng Blender Cycles; có vật liệu thật (vữa, ngói, gỗ, kính, cỏ), trời, nắng và bóng đổ. Mất khoảng 1 phút; `--samples` cao hơn thì đẹp hơn nhưng lâu hơn |
| `plan.svg` | Mặt bằng từng tầng, có tên phòng, diện tích, cửa đi (đỏ), cửa sổ (xanh). Tầng trên vẽ mờ sân vườn và tầng 1 bên dưới. Phòng quá nhỏ để ghi tên thì có số tròn, tên nằm trong chú giải dưới bản vẽ |

Đính kèm **cả 4 file** (`.glb`, `plan.svg`, `iso.svg`, `render.png`) vào task bằng cách upload artifact của skill `paperclip`. Chỉ ghi đường dẫn file là không đủ.

## Định dạng layout.json (tóm tắt)

Xem schema đầy đủ ở skill `kien-truc-nha-o` (`schemas/layout.schema.json`).

- Toạ độ tính bằng mét. `x` chạy theo chiều ngang lô đất (0 = mép trái nhìn từ đường), `y` chạy theo chiều sâu (0 = mặt tiền).
- Mỗi phòng là một hình chữ nhật `{id, name, type, x, y, w, d}`, đo theo **tim tường**. Hai phòng sát nhau thì dùng chung cạnh, không chừa khe.
- Cửa nằm trong `openings` của từng tầng: `{room, side: front|back|left|right, offset, width, kind: door|window}`. `offset` tính từ góc có `x` hoặc `y` nhỏ hơn của cạnh đó.
- Cầu thang là một phòng `type: "stairs"`, phải có **ở cả tầng dưới và tầng trên với cùng toạ độ**.
  - `shape`: `straight` (mặc định), `L` hoặc `U`.
    - **Thang U:** 2 vế song song, mỗi vế rộng nửa ô, chiếu nghỉ ở cuối. Chân thang và đầu trên cùng nằm ở **cạnh đầu**: chân ở nửa thứ nhất, đầu trên ở nửa kia. Ô thang cần rộng ít nhất 1.8m và dài ít nhất 2.2m; thường dùng 2.4 x 3–3.5m.
    - **Thang L:** vế 1 chạy theo `up`, chiếu nghỉ ở góc, vế 2 rẽ ngang và kết thúc ở cạnh bên kia. `flight_width` là bề rộng vế, mặc định 1.0m.
  - `mirror: true` đổi bên của vế đầu tiên.
  - `up` (tuỳ chọn) là hướng đi lên: `+y` (từ phía mặt tiền đi vào trong), `-y`, `+x` (từ trái sang phải), `-x`. Bỏ trống thì đi lên theo cạnh dài, về phía `y` hoặc `x` lớn.
  - Cạnh giữa cầu thang hoặc hành lang với phòng chung (khách, bếp, ăn, sảnh) là **cạnh thông**: bản 3D không xây tường ở đó. Ở tầng trên, lỗ cầu thang có lan can cao 0.9m, chỉ mở chỗ bước lên.
  - `validate` báo lỗi nếu **chân cầu thang** (ở tầng dưới) hoặc **đầu trên** (ở tầng trên) bị tường chặn. Cạnh đầu, hoặc 1m đầu ở hai bên, phải giáp hành lang hoặc phòng chung, hoặc có cửa đi. Gặp lỗi này thì đổi `up`, hoặc xếp sảnh hoặc hành lang vào chỗ bước lên.
- Mái nhà: `roof.type` là `flat` (mái bằng), `gable` (2 mái), `hip` (4 mái, dùng cho "mái thái", "mái Nhật"), `shed` (mái lệch, kèm `slope_to`: phía nước chảy xuống), `mansard` (mái Pháp, hai độ dốc, có cửa sổ mái; `pitch_deg` là độ dốc phần trên, mặc định 20) hoặc `tiered` (mái chồng 2 cấp, có khe thông gió, kiểu đình hoặc Indochine), cùng `pitch_deg` và `overhang`.
  - **Trộn mái:** khai `roof.blocks: [{x, y, w, d, type?, pitch_deg?, slope_to?, overhang?}]`, mỗi khối một kiểu, ví dụ khối chính `hip`, khối phụ `flat`. Khối phải phủ hết tầng trên cùng, nếu không `validate` sẽ cảnh báo.
  - Mái phủ đúng hình tầng trên cùng: nhà chữ L hoặc chữ U được chia thành nhiều khối mái, không còn một mái chữ nhật trùm cả khoảng trống.
- **Độ thật, tự sinh, không cần khai báo:**
  - cửa sổ có khung, đố và bậu;
  - cửa đi có khung, pano và tay nắm (cửa rộng hơn 1.25m thành 2 cánh); cửa gara rộng từ 2.2m là cửa cuốn;
  - cốt nền `plinth` (mặc định 0.45m), bậc tam cấp trước cửa ngoài tầng 1, dốc trước cửa gara;
  - mái dốc có diềm, máng xối, mây hiên và bờ nóc;
  - cầu thang có dầm và tay vịn.
- **Xếp nội thất tự động:** `python3 scripts/house_builder.py furnish layout.json` (`--replace` để xếp lại từ đầu, `--out` để ghi ra file khác). Lệnh điền đồ cho mọi phòng còn thiếu theo loại phòng và diện tích (`noi-that-chuan.md`): không chồng nhau, chừa 0.8m trước cửa, không che cửa sổ bằng đồ cao, sofa đối diện tivi, giường có tủ hai bên, xe trong gara. Dùng làm điểm khởi đầu rồi chỉnh tay.
- **Cạnh thông và cửa:** hai phòng thông nhau (khách, bếp, ăn, sảnh, cầu thang; giếng trời ở tầng 1) không có tường. Nếu khai `openings` có cửa ở cạnh đó thì bộ dựng xây tường kèm cửa. Cửa ở tầng trên mở vào giếng trời hoặc ra khoảng không là lỗi.
- **Lối đi:** `validate` báo lỗi khi có phòng không tới được từ cửa chính (tầng 1) hoặc từ đầu thang (tầng trên). Ô cầu thang không tính là lối đi, đường vòng ra sân cũng không tính. Cũng báo lỗi: cửa ở cạnh bên ô thang, phải xuyên phòng riêng mới vào được phòng khác, phòng khách không giáp cửa chính hay sảnh. Cảnh báo: ban công bị kẹp, sảnh + hành lang quá 25% sàn.
- **Cửa, cửa sổ, vách kính phải nằm trên tường.** Đặt ở mép ngoài ban công, lô gia, hiên (chỉ có lan can) là lỗi `mep ngoai ban cong`; cửa sổ đặt ở cạnh thông là lỗi `canh thong`. Sửa bằng cách bỏ hoặc dời cửa đó, không được bỏ qua lỗi.
- **Mặt bằng có nội thất:** `plan.svg` vẽ mỗi món đồ một ô vuông, vạch đậm là mặt trước.
- **Màu** của mô hình khớp mã hex đã chọn (bộ dựng đổi sRGB sang tuyến tính khi ghi GLB); màu `garden` chỉ tô cỏ, cây, hồ nước và gạch lát giữ màu riêng.
- **Ban công, lô gia** (`type: "balcony"`): cạnh ngoài là lan can, không xây tường.
- **Hiên, sảnh đón** (`type: "porch"`): cạnh ngoài để trống và có cột, tối đa 3m một cột. Ở tầng 1 có bậc lên hiên. Hiên không có tầng trên che thì có mái hiên phẳng. Hiên ở mặt tiền thì cửa chính có thể mở từ hiên vào nhà.
- **Vách kính** (`openings[].kind: "glass-wall"`): kính từ sàn tới gần trần (`head` mặc định bằng chiều cao tầng trừ 0.3m), có khung và đố đứng mỗi 1.2m. Vách kính được tính như cửa đi (cửa kính trượt) và như cửa sổ.
- **Lam che nắng:** khai trong `floors[].louvers: [{room, side, offset?, width?, kind: vertical|horizontal, from?, to?, depth?, spacing?}]`.
- **Tầng hầm, tầng lửng, chiều cao riêng:**
  - `floors[].height` đặt chiều cao riêng cho từng tầng.
  - `floors[].kind: "basement"` là tầng hầm: chỉ được là tầng đầu tiên trong `floors`, nằm dưới cốt nền, vào bằng cầu thang (chưa vẽ dốc xuống hầm).
  - `floors[].kind: "mezzanine"` là tầng lửng, mặc định cao 2.8m. Phần không có sàn lửng thì khai phòng `void` (thông tầng) có lan can.
  - Thông báo `validate` và `plan.svg` gọi tên các tầng là "Tang ham", "Tang 1", "Tang lung"…
- **Mặt tiền** `facade: {style, railing?, band?, canopy?}`:
  - `style` là một trong `basic` (mặc định), `modern` (lan can kính, ô văng, khung nhôm tối), `classic` (lan can con tiện, gờ chỉ tầng, ô văng, khung trắng), `indochine` (song sắt, gờ chỉ, khung xanh đậm), `minimal`;
  - `railing` là `metal`, `glass`, `baluster` hoặc `wall`, ghi đè kiểu lan can của phong cách.
  - `column` là kiểu cột hiên, ghi đè kiểu mặc định theo phong cách: `steel` (thép vuông mảnh đen, mặc định của `modern`, `minimal`), `wood` (gỗ trên bệ đá, mặc định của `indochine`), `round` (tròn cổ điển, mặc định của `classic`), `stone-base` (trắng, bệ ốp đá, mặc định của `basic`), `square` (vuông trơn). Bộ dựng tự thêm dầm viền, **không đặt cột trước cửa** và không đặt cột ở góc dính tường nhà.
- **Sân thượng** tự có: phần tầng dưới không có tầng trên phủ lên thành sàn sân thượng kèm lan can 0.9m. Không cần khai báo.
- **Giếng trời / thông tầng:** phòng `type: "void"`. Tầng trên không có sàn ở ô này; cạnh giáp phòng chung là lan can (tầng 1 thì thông hẳn). Ô `void` ở tầng trên cùng không có mái che. Không đặt nội thất trong ô này.
- **Nội thất** nằm trong `floors[].furniture`: `{id, item, room, x, y, rotation: 0|90|180|270, color?}`. Mỗi món đã có màu gỗ, vải, kim loại riêng (`tones` trong `catalog.json`); chỉ đặt `color` cho món chủ dự án nêu màu.
  - `item` là mã lấy từ lệnh `catalog`. `(x, y)` là tâm món đồ.
  - `rotation` 0 nghĩa là mặt trước nhìn ra mặt tiền; xoay theo chiều kim đồng hồ khi nhìn từ trên xuống.
  - Quy chuẩn bố trí: `references/noi-that-chuan.md` của skill `kien-truc-nha-o`.
- **Sân vườn, hàng rào, cổng, cây** nằm trong `site` (xem `example-site`):
  - `fence`: `{height, sides: [front|back|left|right], gates: [{side, offset, width, name}]}`. Hàng rào chạy dọc cạnh lô đất; cổng là ô trống có cánh cổng.
  - `garden`: các khu `{id, name, type, x, y, w, d}`. `lawn` (thảm cỏ) và `paving` (sân lát) là nền; `path` (lối đi), `flowerbed` (bồn hoa), `pool` (hồ) được nằm trên nền. Các khu không được đè lên phòng tầng 1.
  - `trees`: `{id, kind: tree|shrub, x, y}`, không đặt trong nhà.
  - Nhà có sân trước thì toạ độ các phòng lùi vào (ví dụ `y` bắt đầu từ 3), và cửa chính đặt ở mép trước của nhà.
- **Đính kèm lại = ghi đè:** file sửa lại giữ **nguyên tên** và đính kèm vào đúng task cũ; hệ thống ghi đè bản cũ và giữ nguyên đường dẫn. Không thêm `-v2`, `-moi`, ngày giờ vào tên.
- **Màu** nằm trong `colors`: `{"categories": {"roof": "#7a3b2e"}, "parts": {"t1-gara-san": "#cccccc"}}`. Chỉ ghi màu chủ dự án nêu. **Không ghi `categories.furniture`** (nó sơn mọi món đồ cùng một màu, validate cảnh báo), trừ khi chủ dự án tự chọn trong bảng màu đã lưu.
  - Thứ tự ưu tiên: màu theo bộ phận > màu theo loại > màu mặc định. Các loại gồm `floor`, `wall`, `door`, `glass`, `stairs`, `furniture`, `garden`, `fence`, `roof`.
  - `partId` lạ (bộ phận không còn tồn tại) sẽ bị bỏ qua.

## Bộ phận (`partId`)

Mỗi bộ phận là một node trong `<ten-san-pham>.glb`, với `extras = {partId, category, floor, room, order}`. Tên ví dụ: `T1 · Gara · Sàn`, `T2 · Ngủ 1 · Giường đôi`. `partId` không đổi khi dựng lại mà mặt bằng giữ nguyên:

| Bộ phận | `partId` |
|---|---|
| Sàn | `t{tầng}-{phòng}-san` |
| Tường | `t{tầng}-tuong-{h\|v}{vị trí}-{đầu}-{cuối}` |
| Cửa đi | `t{tầng}-{phòng}-cua-{side}-{số thứ tự trong openings}` |
| Kính cửa sổ | `t{tầng}-{phòng}-kinh-{side}-{số thứ tự}` |
| Cầu thang | `t{tầng}-{phòng}-cau-thang` |
| Nội thất | `t{tầng}-{phòng}-{id}` |
| Khu sân vườn | `san-vuon-{id}` |
| Cây | `cay-{id}` |
| Hàng rào | `hang-rao-{side}` |
| Cổng | `cong-{số thứ tự trong gates}` |
| Trần tầng trên cùng | `tran` |
| Mái | `mai` |

## Áp bảng màu của chủ dự án

Trình xem 3D trong Paperclip lưu bảng màu thành comment trên task, có dạng:

````
Bảng màu cho <ten-san-pham>.glb
```json
{"houseColors": {"file": "<ten-san-pham>.glb", "categories": {...}, "parts": {...}}}
```
````

Lấy comment **mới nhất** đúng tên file, rồi gộp `categories` và `parts` vào `layout.colors` (giá trị mới ghi đè giá trị cũ). Sau đó `build`, `render` lại và đính kèm lại cả 4 file.

## Giới hạn đã biết

- Hình khối chỉ gồm khối hộp và mái lăng trụ: không có ban công đua ra, mái lệch hay tường cong.
- Nội thất chỉ lấy trong catalog, và chỉ xoay theo bội số 90°.
- Sân vườn chỉ gồm các khu hình chữ nhật trên mặt đất, cây dạng khối đơn giản, và hàng rào chạy theo cạnh lô đất.
- **Không tự viết script dựng riêng** cho phần skill chưa hỗ trợ. Hãy ghi rõ phần còn thiếu vào task và báo PM.
- Ảnh phối cảnh có thể lỗi che khuất nhỏ ở các góc khó.

Nếu yêu cầu cần những thứ trên, ghi rõ vào task là đã đơn giản hoá.
