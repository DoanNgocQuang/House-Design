# Mẫu mặt bằng và quy tắc bố trí

Dùng khi xếp mặt bằng (Kiến trúc sư) và khi duyệt mặt bằng (Kiểm định). Đọc cùng `kich-thuoc-chuan.md`.

## 1. Quy tắc bố trí

**Lối đi**
- Từ cửa chính phải đi tới được mọi phòng, chỉ qua cửa đi hoặc qua hành lang/cầu thang mở. `validate` báo lỗi nếu có phòng không tới được.
- Đi qua một phòng ngủ để vào phòng khác là không đạt, trừ WC hoặc ban công riêng của phòng ngủ đó.
- Hành lang càng ngắn càng tốt: tổng diện tích hành lang + sảnh mỗi tầng nên dưới 15% diện tích sàn.
- Không tạo hành lang cụt nhỏ hơn 2.5m² chỉ để nối một cửa. Hãy dời cửa sang tường chung với sảnh hoặc hành lang chính.

**Ghép phòng**
- Bếp thông hoặc giáp phòng ăn. Cửa WC không mở thẳng ra phòng khách hay bếp, mà mở ra hành lang, sảnh hoặc phòng ngủ.
- WC các tầng chồng thẳng lên nhau, hoặc gom về cùng một trục.
- Cầu thang gần lối vào, không nằm sâu trong phòng ngủ. Chiếu nghỉ hoặc sảnh trước cầu thang rộng ít nhất 1m.
- **Chân và đầu cầu thang không được bị tường chặn.** Chọn hướng đi lên (`up`) trước, rồi xếp phòng:
  - **chân thang** ở tầng dưới giáp phòng khách, sảnh hoặc hành lang;
  - **đầu trên** ở tầng trên giáp sảnh hoặc hành lang, không giáp WC hay phòng ngủ.

  Ví dụ cầu thang chạy `+y` thì cạnh cuối (phía sau) ở tầng trên, hoặc 1m cuối ở hai bên, phải là sảnh hoặc hành lang. `validate` sẽ báo lỗi "bi tuong chan" nếu sai.
- Phòng ngủ chính ở mặt tiền hoặc mặt hậu để có cửa sổ. Phòng ngủ phụ cũng phải có ít nhất một cửa sổ.

**Hình dạng**
- Phòng ngủ và phòng khách gần vuông: tỉ lệ dài/rộng không quá 2 (phòng ngủ) hoặc 2.5 (phòng khách).
- Cạnh ngắn tối thiểu: phòng ngủ 2.7m, phòng khách 3m, phòng ăn 2.4m, bếp 1.8m, WC 1.2m, hành lang và cầu thang 0.9m.
- Phủ kín khung nhà: mỗi tầng không để khoảng trống không thuộc phòng nào. Phần thừa thì nhập vào phòng bên cạnh, hoặc đặt tên (kho, giếng trời, lô gia).
- Tầng trên nằm gọn trên tầng dưới. Chỉ ban công được chìa ra.

## 2. Lỗi hay gặp và cách sửa

| Lỗi | Ví dụ | Cách sửa |
|---|---|---|
| Hành lang vụn | "Hành lang nối PN3" 1.5x1.4m chỉ để vào một phòng | Mở cửa phòng đó ra sảnh sinh hoạt hoặc hành lang chính, bỏ hành lang vụn |
| WC kẹp giữa hai hành lang | WC chung nằm giữa hành lang cạnh thang và hành lang nối | Đưa WC sát tường ngoài hoặc mặt hậu, cửa mở ra một hành lang |
| Hai WC sát nhau ở giữa nhà | WC phòng ngủ và WC chung xếp chồng theo chiều sâu | Được phép nếu cùng trục ống nước, nhưng mỗi WC chỉ có một cửa vào |
| Phòng không cửa sổ | Phòng ngủ nằm giữa nhà phố | Đổi chỗ với WC hoặc kho; hoặc thêm giếng trời (phòng `hall` tên "Giếng trời") giáp phòng |
| Tầng trên chìa ra | Sảnh tầng 2 đặt trên sân trước | Thu vào trong khung tầng 1, hoặc đổi `type` thành `balcony` |

## 3. Mặt bằng mẫu

Lấy mẫu có toạ độ đầy đủ bằng lệnh của skill `house-builder`, rồi sửa theo `spec.json`:

- `python3 scripts/house_builder.py example`: **nhà phố 2 tầng 5x20m**, có gara.
  - Tầng 1: gara (mặt tiền) → phòng khách + cầu thang thẳng sát tường phải → bếp + ăn → WC và sân sau.
  - Tầng 2: phòng ngủ 1 (mặt tiền) → phòng ngủ 2 + chiếu nghỉ → sảnh → phòng ngủ 3 → WC và lô gia.
- `python3 scripts/house_builder.py example-site`: **nhà có sân vườn 9x24m**, có hàng rào, cổng, sân trước lát gạch, thảm cỏ hai bên và vườn sau.
- `python3 scripts/house_builder.py example-modern`: **nhà hiện đại chữ L 14x20m, mái lệch**.
  - Tầng 1 chữ L: khách, sảnh, phòng ngủ ông bà ở phía trước; bếp + ăn và cầu thang ở phía sau; giếng trời cạnh WC.
  - Tầng 2 nhỏ hơn: phần lộ ra phía trước thành sân thượng. Giếng trời thông lên trời, có lan can.

Cả hai mẫu đều qua `validate` mà không có cảnh báo. Đây là mức tối thiểu phải đạt.

### Hình khối: làm nhà khác nhau, không chỉ là hộp chữ nhật

Bộ dựng tự xử lý các hình khối sau, chỉ cần xếp phòng đúng:
- **Chữ L, chữ U:** phòng không cần phủ kín hình chữ nhật bao ngoài. Phần khuyết mở ra ngoài (sân, vườn) không bị cảnh báo. Mái tự chia khối theo hình nhà.
  - Mái `hip`/`gable` hợp với các cánh rộng từ 4m. Chỗ lồi nhỏ (ô cầu thang, WC thò ra) thì dùng mái `flat` hoặc `shed`.
  - Chỉ ô trống bị phòng bao kín bốn phía mới bị cảnh báo.
- **Giật cấp, sân thượng:** tầng trên nhỏ hơn tầng dưới. Phần tầng dưới lộ ra tự thành sân thượng có lan can. Nhớ thêm cửa đi từ một phòng tầng trên ra sân thượng (cửa trên tường ngoài).
- **Giếng trời / thông tầng:** phòng `type: "void"`.
  - Ở tầng 1 là sân trong đi lại được, thông với phòng chung, có thể mở cửa WC ra đây.
  - Ở tầng trên không có sàn; cạnh giáp hành lang hoặc phòng chung có lan can. Ở tầng trên cùng không có mái che.
  - Phòng ngủ giáp giếng trời nên có cửa sổ nhìn ra giếng.
- **Mái lệch (`shed`):** một mặt dốc chung cho cả nhà, hợp với nhà hiện đại. `slope_to` là phía nước chảy xuống.
- **Mái mansard và mái chồng cấp:** `mansard` cho biệt thự tân cổ điển, `tiered` cho nhà Indochine hoặc nhà vườn kiểu đình. Hai kiểu này cần khối mái rộng từ 6m mới đẹp.
- **Trộn mái (`roof.blocks`):** khối chính dùng mái dốc, các khối phụ nhỏ (gara, ô cầu thang thò ra, WC) dùng mái bằng hoặc mái lệch.
- **Cầu thang chữ U** tiết kiệm chiều dài: ô 2.4 x 3m thay cho thang thẳng 1.2 x 5m. Chân và đầu thang cùng ở một cạnh, nên đặt cạnh sảnh hoặc hành lang.
- **Hiên có cột (`porch`) và vách kính (`glass-wall`)** làm mặt tiền biệt thự, nhà vườn trông thật hơn. Cửa chính mở từ hiên vào phòng khách.
- **Tầng lửng:** khai một tầng `kind: "mezzanine"` thấp hơn, và một ô `void` phía trên phòng khách để phòng khách thông tầng.

### Sơ đồ phân khu theo loại nhà (đọc từ mặt tiền vào)

**Nhà ống 4x16m, 3 tầng**
```
Tầng 1: [Gara/khách 4x5] [Khách + thang 4x5, thang sát tường] [Bếp + ăn 4x4] [WC 1.5x2 | sân phơi]
Tầng 2: [PN chính 4x4 + cửa sổ mặt tiền] [sảnh 1x? cạnh thang] [PN2 4x3.5 + cửa sổ mặt hậu] [WC]
Tầng 3: [Phòng thờ 4x3 mặt tiền] [sảnh thang] [Phòng giặt/phơi + sân thượng]
```

**Nhà phố 5x20m, 2 tầng (có sân trước 3m)**
```
Sân trước 5x3 → Tầng 1: [Khách 5x5] [Thang 1.2x5 + WC 1.6x2] [Bếp + ăn 5x5] [Sân sau]
Tầng 2:        [PN chính 5x4 + ban công trước] [Sảnh sinh hoạt + thang] [PN2 + PN3 phía sau, mỗi phòng ≥ 9m², WC chung giữa]
```

**Nhà ống 4x16m, 4 tầng giật cấp, có giếng trời** (`nha-ong`, `giat-cap`, mái `flat`)
```
Tầng 1: [Gara/khách 4x6] [Thang 1x4 sát tường + giếng trời 2x2.5 cạnh thang] [Bếp + ăn 4x4] [WC]
Tầng 2-3: [PN 4x4 mặt tiền + ban công] [Sảnh + thang | giếng trời có lan can] [PN 4x3.5 phía sau, cửa sổ nhìn giếng]
Tầng 4: chỉ nửa sau: [Phòng thờ] [Giặt phơi]; nửa trước để trống → sân thượng
```

**Nhà cấp 4 chữ L 8x20m, 1 tầng** (`nha-cap-4`, `chu-L`, mái `hip`)
```
Cánh trước (ngang lô, 8x6): [Khách 4.5x6] [PN1 3.5x6]
Cánh dọc bên trái (4.5x9): [Bếp + ăn 4.5x5] [PN2 4.5x4]; hành lang 1.2m dọc mép cánh, WC cuối hành lang
Phần khuyết bên phải → sân trong, cửa bếp mở ra sân
```

**Nhà vườn chữ U 15x25m, 1–2 tầng** (`nha-vuon`, `chu-U`, mái `gable`)
```
Cánh trái: [Khách + thang] [Bếp + ăn]      Cánh giữa (phía sau): [Hành lang + WC] [PN chính]
Cánh phải: [PN2] [PN3]                      Giữa chữ U: sân vườn (garden trong site), hiên nối các cánh
```

**Nhà hiện đại 2 tầng giật cấp 10x20m** (`nha-hien-dai`, mái `shed`): xem `example-modern`.
```
Tầng 1 (chữ L): [Khách 5.6x6 | Sảnh | PN ông bà] → [Bếp + ăn | Thang] → [Giếng trời | WC]
Tầng 2 (lùi 3m): sân thượng phía trước → [PN chính có cửa ra sân thượng] → [PN con | Hành lang] → [giếng trời | WC]
```

**Biệt thự 10x20m, nhà 8x12m lùi 3m**
```
Tầng 1: [Sảnh vào + khách 5x6] [Thang ở giữa nhà] [Bếp + ăn 5x6] [WC khách cạnh thang] [Phòng ngủ người già 3.5x4]
Tầng 2: [PN chính + WC riêng ở mặt tiền] [Sảnh sinh hoạt quanh thang] [PN2, PN3 phía sau dùng WC chung]
```
