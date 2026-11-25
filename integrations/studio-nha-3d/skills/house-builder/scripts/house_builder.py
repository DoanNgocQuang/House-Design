#!/usr/bin/env python3
"""Dung mo hinh nha 3D tu layout.json. Chi dung thu vien chuan cua Python.

  python3 house_builder.py furnish layout.json      # tu xep noi that day du cho cac phong con thieu (--replace: xep lai)
  python3 house_builder.py render layout.json --out render.png   # anh phoi canh that (Blender Cycles, vai phut)
  python3 house_builder.py example --type <ma>      # nha mau theo kieu (examples/<ma>.json)
  python3 house_builder.py example                 # in layout mau
  python3 house_builder.py validate layout.json    # kiem tra, exit 1 neu co loi
  python3 house_builder.py build layout.json --out ket-qua/
  python3 house_builder.py example-site            # layout mau co san vuon, hang rao, cong, cay
  python3 house_builder.py example-modern          # nha chu L, mai lech, san thuong, gieng troi
  python3 house_builder.py catalog                 # danh sach noi that co the dat
  python3 house_builder.py selftest

Toa do mat bang (met): x theo chieu ngang lo dat (0 = mep trai), y theo chieu sau
(0 = mat tien, phia duong). Phong la hinh chu nhat {x, y, w, d} tinh theo tim tuong.
shortcut: hinh hoc chi gom khoi hop va mai lang tru, khong noi that, ve bang thuat toan
hoa si (painter) nen co the sai thu tu che khuat o goc kho; nang cap neu can chi tiet hon.
"""
import argparse
import json
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

WALL_T = 0.15
SLAB_T = 0.15
DOOR_H = 2.1
WIN_SILL, WIN_HEAD = 0.9, 2.1
EPS = 1e-6

CATEGORY_COLORS = {  # loai bo phan -> mau RGB 0..1 mac dinh (noi that giu mau goc cua thu vien)
    "floor": (0.78, 0.72, 0.62),
    "wall": (0.94, 0.91, 0.85),
    "door": (0.55, 0.36, 0.22),
    "glass": (0.50, 0.70, 0.84),
    "stairs": (0.55, 0.43, 0.39),
    "roof": (0.70, 0.31, 0.22),
    "fence": (0.36, 0.36, 0.40),
    "garden": (0.45, 0.66, 0.33),
    "frame": (0.36, 0.25, 0.17),
    "railing": (0.22, 0.23, 0.25),
    "trim": (0.90, 0.88, 0.83),
    "column": (0.92, 0.90, 0.86),
}
PLINTH_RGB = (0.60, 0.58, 0.54)   # cot nen, bac tam cap (da)
GUTTER_RGB = (0.55, 0.56, 0.58)
HANDLE_RGB = (0.78, 0.66, 0.36)
PLINTH = 0.45                     # nen nha cao hon san vuon
FRAME_W = 0.06                    # be rong khung cua
# Phong cach mat tien: kieu lan can, go tang, o vang tren cua so, mau khung cua.
FACADE_STYLES = {
    "basic": {"railing": "metal", "band": False, "canopy": False, "frame": (0.36, 0.25, 0.17)},
    "modern": {"railing": "glass", "band": False, "canopy": True, "frame": (0.20, 0.21, 0.23)},
    "classic": {"railing": "baluster", "band": True, "canopy": True, "frame": (0.95, 0.94, 0.90)},
    "indochine": {"railing": "metal", "band": True, "canopy": True, "frame": (0.20, 0.30, 0.24)},
    "minimal": {"railing": "metal", "band": False, "canopy": False, "frame": (0.16, 0.16, 0.17)},
}
RAILING_STYLES = ("metal", "glass", "baluster", "wall")
COLUMN_STYLES = ("square", "steel", "wood", "stone-base", "round")
COLUMN_BY_FACADE = {"modern": "steel", "minimal": "steel", "indochine": "wood", "classic": "round", "basic": "stone-base"}
STEEL_RGB, WOOD_RGB, STONE_RGB = (0.13, 0.13, 0.14), (0.42, 0.27, 0.16), (0.45, 0.44, 0.42)
DOOR_KINDS = ("door", "glass-wall")  # loai lo cua di qua duoc (vach kinh = cua kinh truot)
OPENING_KINDS = ("door", "window", "glass-wall")
LOUVER_RGB = (0.55, 0.38, 0.24)
FLOOR_KINDS = ("normal", "basement", "mezzanine")
MEZZANINE_H = 2.8

ROOM_COLORS = {
    "living": "#f6e7c8", "kitchen": "#fde2cf", "dining": "#fbe0b8", "bedroom": "#dbe9f6",
    "wc": "#d5efe8", "garage": "#e3e3e3", "stairs": "#e8d8cf", "hall": "#f1f1ea",
    "balcony": "#e6f2d9", "worship": "#f5d7d7", "laundry": "#e5e0f2", "storage": "#ececec",
    "void": "#d6ecf5", "porch": "#efe9dc",
}
# Dien tich toi thieu (m2) de canh bao; nguon: references/kich-thuoc-chuan.md cua skill kien-truc-nha-o.
MIN_AREA = {"bedroom": 9.0, "wc": 3.0, "kitchen": 5.0, "living": 12.0, "garage": 15.0}
NO_DOOR_NEEDED = {"stairs", "hall", "balcony", "void", "porch"}
# Canh ngan toi thieu (m) va ti le dai/rong toi da; nguon: references/kich-thuoc-chuan.md.
MIN_WIDTH = {"bedroom": 2.7, "living": 3.0, "kitchen": 1.8, "dining": 2.4, "wc": 1.2, "hall": 0.9, "stairs": 0.9}
MAX_RATIO = {"bedroom": 2.0, "living": 2.5, "kitchen": 3.0, "dining": 2.5}
NEEDS_WINDOW = {"bedroom", "living"}
OPEN_SPACES = {"hall", "stairs"}  # hanh lang, cau thang mo thang ra phong chung, khong can cua
COMMON_ROOMS = {"living", "dining", "kitchen", "hall", "stairs"}
PRIVATE_ROOMS = {"bedroom", "wc", "garage", "storage", "laundry", "worship", "balcony"}  # khong lam loi di xuyen toi phong khac
MAX_HALL_SHARE = 0.25
STAIR_DIRS = ("+y", "-y", "+x", "-x")
STAIR_SHAPES = ("straight", "L", "U")
STAIR_ZONE = 1.0      # doan dau/cuoi cau thang (m) phai thong ra ngoai de buoc len/xuong
STAIR_GAP = 0.6       # be rong toi thieu cua loi buoc len/xuong
RAILING_H = 0.9       # lan can quanh lo cau thang, gieng troi va san thuong
ROOF_TYPES = ("flat", "gable", "hip", "shed", "mansard", "tiered")
ROOF_PITCH = {"hip": 35, "gable": 30, "shed": 12, "mansard": 20, "tiered": 30}  # do doc mac dinh (mansard: phan tren)
SLOPE_SIDES = ("front", "back", "left", "right")


# ---------------------------------------------------------------- kiem tra

def validate(layout):
    """Tra ve (errors, warnings, stats). errors rong nghia la layout dung duoc."""
    errors, warnings = [], []
    try:
        lot_w, lot_d = float(layout["lot"]["width"]), float(layout["lot"]["depth"])
        height = float(layout.get("floor_height", 3.3))
        floors = layout["floors"]
    except (KeyError, TypeError, ValueError) as exc:
        return [f"Thieu truong bat buoc hoac sai kieu: {exc}"], [], {}
    if (layout.get("colors") or {}).get("categories", {}).get("furniture"):
        warnings.append("colors.categories.furniture son moi mon noi that cung mot mau; chi giu khi chu du an tu chon mau nay")
    if lot_w <= 0 or lot_d <= 0 or height <= 2.2:
        errors.append("lot.width/lot.depth phai > 0 va floor_height phai > 2.2m")
    if not floors:
        errors.append("Can it nhat 1 tang trong 'floors'")
    for fi, floor in enumerate(floors, start=1):
        kind = floor.get("kind", "normal")
        if kind not in FLOOR_KINDS:
            errors.append(f"Tang {fi}: kind '{kind}' khong hop le ({' | '.join(FLOOR_KINDS)})")
        elif kind == "basement" and fi != 1:
            errors.append(f"Tang {fi}: tang ham (kind basement) chi duoc la tang dau tien trong 'floors'")
        elif kind == "mezzanine" and fi == 1:
            errors.append("Tang 1: tang lung phai nam tren mot tang khac")
        if "height" in floor and not 2.2 < float(floor["height"]) <= 8:
            errors.append(f"Tang {fi}: height phai > 2.2m va <= 8m")
    if floors and all(f.get("kind") == "basement" for f in floors):
        errors.append("Can it nhat 1 tang tren mat dat (khong chi co tang ham)")
    ground = _ground_index(floors) + 1
    roof = layout.get("roof", {}).get("type", "flat")
    if roof not in ROOF_TYPES:
        errors.append(f"roof.type '{roof}' khong hop le ({' | '.join(ROOF_TYPES)})")
    facade = layout.get("facade") or {}
    if facade.get("style", "basic") not in FACADE_STYLES:
        errors.append(f"facade.style '{facade.get('style')}' khong hop le ({' | '.join(FACADE_STYLES)})")
    if facade.get("railing", "metal") not in RAILING_STYLES:
        errors.append(f"facade.railing '{facade.get('railing')}' khong hop le ({' | '.join(RAILING_STYLES)})")
    if facade.get("column", "square") not in COLUMN_STYLES:
        errors.append(f"facade.column '{facade.get('column')}' khong hop le ({' | '.join(COLUMN_STYLES)})")
    if not 0 <= float(layout.get("plinth", PLINTH)) <= 1.2:
        errors.append("plinth (cot nen) phai tu 0 den 1.2m")
    for k, block in enumerate(layout.get("roof", {}).get("blocks") or []):
        try:
            bx, by, bw, bd = (float(block[key]) for key in ("x", "y", "w", "d"))
        except (KeyError, TypeError, ValueError):
            errors.append(f"roof.blocks[{k}] thieu x/y/w/d")
            continue
        if block.get("type", roof) not in ROOF_TYPES:
            errors.append(f"roof.blocks[{k}].type '{block.get('type')}' khong hop le ({' | '.join(ROOF_TYPES)})")
        if block.get("slope_to", "back") not in SLOPE_SIDES:
            errors.append(f"roof.blocks[{k}].slope_to phai la {' | '.join(SLOPE_SIDES)}")
        if bw <= 0 or bd <= 0 or bx < -EPS or by < -EPS or bx + bw > lot_w + EPS or by + bd > lot_d + EPS:
            errors.append(f"roof.blocks[{k}] co kich thuoc <= 0 hoac tran ra ngoai lo dat")
    if layout.get("roof", {}).get("blocks") and floors:
        top_rooms = [r for r in _valid_rooms(floors[-1].get("rooms", [])) if r.get("type") != "void"]
        blocks = [{"x": float(b["x"]), "y": float(b["y"]), "w": float(b["w"]), "d": float(b["d"])}
                  for b in layout["roof"]["blocks"] if all(isinstance(b.get(key), (int, float)) for key in ("x", "y", "w", "d"))]
        bxs, bys = _grid(top_rooms, blocks)
        bare = _cells(top_rooms, bxs, bys) - _cells(blocks, bxs, bys)
        bare_area = sum((bxs[i + 1] - bxs[i]) * (bys[j + 1] - bys[j]) for i, j in bare)
        if bare_area > 0.5:
            warnings.append(f"Mai: {bare_area:.1f}m2 tang tren cung khong nam trong khoi mai nao (roof.blocks)")
    if layout.get("roof", {}).get("slope_to", "back") not in SLOPE_SIDES:
        errors.append(f"roof.slope_to phai la {' | '.join(SLOPE_SIDES)} (huong nuoc chay cua mai lech)")

    stats = {"floors": len(floors), "rooms": {}, "floor_area": []}
    for fi, floor in enumerate(floors, start=1):
        rooms = floor.get("rooms", [])
        ids = [r.get("id") for r in rooms]
        if len(set(ids)) != len(ids):
            errors.append(f"Tang {fi}: id phong bi trung")
        area = 0.0
        for r in rooms:
            try:
                x, y, w, d = (float(r[k]) for k in ("x", "y", "w", "d"))
            except (KeyError, TypeError, ValueError):
                errors.append(f"Tang {fi}: phong {r.get('id')} thieu x/y/w/d")
                continue
            if w <= 0 or d <= 0:
                errors.append(f"Tang {fi}: phong {r['id']} co kich thuoc <= 0")
            if x < -EPS or y < -EPS or x + w > lot_w + EPS or y + d > lot_d + EPS:
                errors.append(f"Tang {fi}: phong {r['id']} tran ra ngoai lo dat {lot_w}x{lot_d}m")
            kind = r.get("type", "other")
            stats["rooms"][kind] = stats["rooms"].get(kind, 0) + 1
            area += w * d
            if kind in MIN_AREA and w * d < MIN_AREA[kind] - EPS:
                warnings.append(f"Tang {fi}: {r['id']} ({kind}) chi {w*d:.1f}m2, nho hon chuan {MIN_AREA[kind]}m2")
            if kind in MIN_WIDTH and min(w, d) < MIN_WIDTH[kind] - EPS:
                warnings.append(f"Tang {fi}: {r['id']} ({kind}) hep {min(w, d):g}m, canh ngan toi thieu {MIN_WIDTH[kind]}m")
            if kind in MAX_RATIO and min(w, d) > 0 and max(w, d) / min(w, d) > MAX_RATIO[kind] + EPS:
                warnings.append(f"Tang {fi}: {r['id']} ({kind}) dai hep {max(w, d):g}x{min(w, d):g}m, ti le toi da {MAX_RATIO[kind]}")
        stats["floor_area"].append(round(area, 1))
        for i, a in enumerate(rooms):
            for b in rooms[i + 1:]:
                if _overlap_area(a, b) > 0.01:
                    errors.append(f"Tang {fi}: phong {a['id']} va {b['id']} chong len nhau")
        by_id = {r.get("id"): r for r in rooms}
        for o in floor.get("openings", []):
            room = by_id.get(o.get("room"))
            if room is None:
                errors.append(f"Tang {fi}: cua tham chieu phong khong ton tai '{o.get('room')}'")
                continue
            if o.get("side") not in ("front", "back", "left", "right"):
                errors.append(f"Tang {fi}: cua cua {o['room']} co side khong hop le")
                continue
            edge_len = float(room["w"] if o["side"] in ("front", "back") else room["d"])
            if float(o.get("offset", 0)) < 0 or float(o.get("offset", 0)) + float(o.get("width", 0.9)) > edge_len + EPS:
                errors.append(f"Tang {fi}: cua tren canh {o['side']} cua {o['room']} vuot qua chieu dai canh")
        for o in floor.get("openings", []):
            if o.get("kind", "door") not in OPENING_KINDS:
                errors.append(f"Tang {fi}: cua cua {o.get('room')} co kind '{o.get('kind')}' khong hop le ({' | '.join(OPENING_KINDS)})")
        for k, lv in enumerate(floor.get("louvers", [])):
            room = by_id.get(lv.get("room"))
            if room is None or lv.get("side") not in SIDE_NAMES:
                errors.append(f"Tang {fi}: louvers[{k}] can room co that va side front|back|left|right")
            elif lv.get("kind", "vertical") not in ("vertical", "horizontal"):
                errors.append(f"Tang {fi}: louvers[{k}].kind phai la vertical hoac horizontal")
            elif float(lv.get("offset", 0)) < 0 or float(lv.get("offset", 0)) + float(lv.get("width", 0)) > float(
                    room["w"] if lv["side"] in ("front", "back") else room["d"]) + EPS:
                errors.append(f"Tang {fi}: louvers[{k}] vuot qua chieu dai canh {lv['side']} cua {lv['room']}")
        door_segments = [_opening_segment(by_id[o["room"]], o) for o in floor.get("openings", [])
                         if o.get("kind", "door") in DOOR_KINDS and o.get("room") in by_id
                         and o.get("side") in ("front", "back", "left", "right")]
        for r in rooms:
            if r.get("type") in NO_DOOR_NEEDED or "x" not in r:
                continue
            if not any(_segment_on_room_edge(seg, r) for seg in door_segments):
                errors.append(f"Tang {fi}: phong {r['id']} khong co cua di nao")
        front_y = min((float(r["y"]) for r in rooms if "y" in r), default=0.0)
        _validate_openings_have_wall(fi, floor, errors)
        if fi > ground:
            _validate_upper_doors(fi, floor, floors[fi - 2], errors)
        porches = [r for r in _valid_rooms(rooms) if r.get("type") == "porch" and abs(float(r["y"]) - front_y) < EPS]
        if fi == ground and not any(seg[0] == "h" and abs(seg[1] - front_y) < EPS or any(_segment_on_room_edge(seg, r) for r in porches)
                                    for seg in door_segments):
            errors.append(f"Tang 1: khong co cua chinh o mat tien cua nha (y = {front_y:g})")
        _validate_layout_quality(fi, floor, floors[fi - 2] if fi > 1 else None, door_segments, errors, warnings,
                                 has_upper=fi < len(floors), is_ground=fi == ground)
        _validate_furniture(fi, floor, by_id, door_segments, errors, warnings,
                            check_essentials=any(f.get("furniture") for f in floors))

    for fi, floor in enumerate(floors, start=1):
        for r in floor.get("rooms", []):
            if r.get("type") == "stairs" and r.get("up") not in (None, *STAIR_DIRS):
                errors.append(f"Tang {fi}: cau thang {r.get('id')} co up '{r.get('up')}' khong hop le ({' | '.join(STAIR_DIRS)})")
            if r.get("type") == "stairs" and r.get("shape", "straight") not in STAIR_SHAPES:
                errors.append(f"Tang {fi}: cau thang {r.get('id')} co shape '{r.get('shape')}' khong hop le ({' | '.join(STAIR_SHAPES)})")
            elif r.get("type") == "stairs" and r.get("shape") in ("L", "U") and all(k in r for k in "xywd"):
                length, width, _m = _stair_frame(r, _stair_dir(r))
                if width < 1.8 - EPS or length < 2.2 - EPS:
                    errors.append(f"Tang {fi}: cau thang {r.get('id')} chu {r['shape']} can o rong >= 1.8m va dai >= 2.2m "
                                  f"theo huong len (hien {width:g} x {length:g}m)")
    for fi in range(1, len(floors)):
        lower = _valid_rooms([r for r in floors[fi - 1].get("rooms", []) if r.get("type") == "stairs"])
        upper = _valid_rooms([r for r in floors[fi].get("rooms", []) if r.get("type") == "stairs"])
        pairs = [(a, b) for a in lower for b in upper if all(abs(float(a[k]) - float(b[k])) < 0.05 for k in "xywd")]
        if not lower:
            errors.append(f"Tang {fi}: can phong cau thang (type 'stairs') de len tang {fi + 1}")
        elif not pairs:
            errors.append(f"Tang {fi + 1}: can o cau thang trung vi tri voi cau thang tang {fi}")
        for a, b in pairs:
            if a.get("up") not in (None, *STAIR_DIRS) or a.get("shape", "straight") not in STAIR_SHAPES:
                continue
            kind = f"up {_stair_dir(a)}, shape {a.get('shape', 'straight')}"
            if not _stair_access(floors[fi - 1], a, "entry"):
                errors.append(f"Tang {fi}: chan cau thang {a['id']} bi tuong chan: cho buoc len ({_access_text(a, 'entry')}) "
                              f"phai giap hanh lang/phong chung hoac co cua di (doi 'up'/'shape' neu can, hien {kind})")
            if not _stair_access(floors[fi], b, "arrival", plan_from=a):
                errors.append(f"Tang {fi + 1}: dau tren cau thang {b['id']} bi tuong chan: cho buoc ra ({_access_text(a, 'arrival')}) "
                              f"phai giap hanh lang/phong chung hoac co cua di (doi 'up'/'shape' neu can, hien {kind})")
    _validate_site(layout, lot_w, lot_d, errors, warnings)
    names = _floor_names(floors)
    if any(n != f"Tang {i}" for i, n in names.items()):  # tang ham / tang lung: doi so tang trong thong bao thanh ten tang
        rename = lambda text: re.sub(r"\b([Tt])ang (\d+)\b",
                                     lambda m: (lambda n: n if m.group(1) == "T" else n[0].lower() + n[1:])(names.get(int(m.group(2)), m.group(0))), text)
        errors, warnings = [rename(e) for e in errors], [rename(w) for w in warnings]
    return errors, warnings, stats


def _validate_openings_have_wall(fi, floor, errors):
    """Cua, cua so, vach kinh phai nam tren tuong: khong dat o mep ngoai ban cong/hien, khong dat cua so o canh thong."""
    rooms = _valid_rooms(floor.get("rooms", []))
    by_id = {r["id"]: r for r in rooms}
    links = [seg for _a, _b, seg in _open_links(rooms, floor) + _void_links(rooms, floor)]
    for o in floor.get("openings", []):
        if o.get("room") not in by_id or o.get("side") not in SIDE_NAMES:
            continue
        seg = _opening_segment(by_id[o["room"]], o)
        where = f"Tang {fi}: {o.get('kind', 'door')} cua {o['room']} ({o['side']})"
        touching = [by_id[o["room"]]] + [r for r in rooms if _segment_on_room_edge(seg, r)]
        if all(r.get("type") in ("balcony", "porch") for r in touching):
            errors.append(f"{where} dat o mep ngoai ban cong/hien, cho do chi co lan can, khong co tuong (bo cua nay)")
        elif any(s[0] == seg[0] and abs(s[1] - seg[1]) < EPS and min(s[3], seg[3]) - max(s[2], seg[2]) > EPS for s in links):
            errors.append(f"{where} dat o canh thong, khong co tuong (bo cua so nay, hoac them cua di de co tuong)")


def _validate_upper_doors(fi, floor, lower_floor, errors):
    """Cua di tang tren khong duoc mo vao gieng troi hay ra khoang khong (phai co ban cong, san thuong de buoc ra)."""
    rooms = _valid_rooms(floor.get("rooms", []))
    by_id = {r["id"]: r for r in rooms}
    lower = [r for r in _valid_rooms(lower_floor.get("rooms", [])) if r.get("type") not in ("void", "balcony", "porch")]
    inside = lambda r, x, y: r["x"] < x < r["x"] + r["w"] and r["y"] < y < r["y"] + r["d"]
    for o in floor.get("openings", []):
        if o.get("kind", "door") not in DOOR_KINDS or o.get("room") not in by_id or o.get("side") not in SIDE_NAMES:
            continue
        seg = _opening_segment(by_id[o["room"]], o)
        touching = [r for r in rooms if _segment_on_room_edge(seg, r)]
        void = next((r for r in touching if r.get("type") == "void"), None)
        where = f"Tang {fi}: cua cua {o['room']} ({o['side']})"
        if void is not None:
            errors.append(f"{where} mo vao gieng troi / o thong tang '{void['id']}', buoc qua se roi xuong tang duoi")
        elif len(touching) == 1 and touching[0].get("type") not in ("balcony", "porch"):
            axis, pos, a, b = seg
            step = _out_sign(o["side"]) * 0.4
            x, y = ((a + b) / 2, pos + step) if axis == "h" else (pos + step, (a + b) / 2)
            if not any(inside(r, x, y) for r in lower) or any(inside(r, x, y) for r in rooms):
                errors.append(f"{where} mo ra khoang khong: ben ngoai khong co ban cong hay san thuong de buoc ra")


def _ground_index(floors):
    """Chi so (tu 0) cua tang tren mat dat dau tien (bo qua tang ham)."""
    return 1 if floors and floors[0].get("kind") == "basement" and len(floors) > 1 else 0


def _floor_names(floors):
    """{so thu tu tu 1: ten tang}: 'Tang ham', 'Tang lung', 'Tang 1', 'Tang 2'..."""
    names, level, mezz = {}, 0, 0
    for i, floor in enumerate(floors, start=1):
        kind = floor.get("kind", "normal")
        if kind == "basement":
            names[i] = "Tang ham"
        elif kind == "mezzanine":
            mezz += 1
            names[i] = "Tang lung" if mezz == 1 else f"Tang lung {mezz}"
        else:
            level += 1
            names[i] = f"Tang {level}"
    return names


def _levels(layout):
    """[(cao do san, chieu cao)] tung tang. Tang tren mat dat dau tien bat dau o cot nen; tang ham nam ngay duoi."""
    default = float(layout.get("floor_height", 3.3))
    plinth = float(layout.get("plinth", PLINTH))
    floors = layout["floors"]
    heights = [float(f.get("height", MEZZANINE_H if f.get("kind") == "mezzanine" else default)) for f in floors]
    z = plinth - (heights[0] if _ground_index(floors) == 1 else 0.0)
    out = []
    for h in heights:
        out.append((z, h))
        z += h
    return out


def _valid_rooms(rooms):
    return [r for r in rooms if all(isinstance(r.get(k), (int, float)) for k in ("x", "y", "w", "d"))]


def _shared_edge(a, b):
    """Do dai canh chung cua hai phong ke nhau (0 neu khong ke)."""
    ax0, ay0, ax1, ay1 = a["x"], a["y"], a["x"] + a["w"], a["y"] + a["d"]
    bx0, by0, bx1, by1 = b["x"], b["y"], b["x"] + b["w"], b["y"] + b["d"]
    if abs(ax1 - bx0) < EPS or abs(bx1 - ax0) < EPS:
        return max(0.0, min(ay1, by1) - max(ay0, by0))
    if abs(ay1 - by0) < EPS or abs(by1 - ay0) < EPS:
        return max(0.0, min(ax1, bx1) - max(ax0, bx0))
    return 0.0


def _shared_segment(a, b):
    """Canh chung cua hai phong ke nhau: ('h', y, x0, x1) / ('v', x, y0, y1), hoac None."""
    ax0, ay0, ax1, ay1 = a["x"], a["y"], a["x"] + a["w"], a["y"] + a["d"]
    bx0, by0, bx1, by1 = b["x"], b["y"], b["x"] + b["w"], b["y"] + b["d"]
    for pos in (ax1, ax0):
        if abs(pos - bx0) < EPS or abs(pos - bx1) < EPS:
            lo, hi = max(ay0, by0), min(ay1, by1)
            if hi - lo > EPS:
                return ("v", pos, lo, hi)
    for pos in (ay1, ay0):
        if abs(pos - by0) < EPS or abs(pos - by1) < EPS:
            lo, hi = max(ax0, bx0), min(ax1, bx1)
            if hi - lo > EPS:
                return ("h", pos, lo, hi)
    return None


def _door_segs(floor):
    """Doan co khai cua di: KTS muon co tuong o canh do, nen khong con la canh thong."""
    rooms = {r["id"]: r for r in _valid_rooms(floor.get("rooms", []))}
    return [_opening_segment(rooms[o["room"]], o) for o in floor.get("openings", [])
            if o.get("kind", "door") in DOOR_KINDS and o.get("room") in rooms and o.get("side") in SIDE_NAMES]


def _has_door(seg, doors):
    return any(d[0] == seg[0] and abs(d[1] - seg[1]) < EPS and min(d[3], seg[3]) - max(d[2], seg[2]) >= 0.3 for d in doors)


def _open_links(rooms, floor=None):
    """Cap phong thong nhau khong can cua (hanh lang/cau thang mo ra phong chung): [(a, b, canh chung)].
    Canh co khai cua di (`floor`) thi khong thong: co tuong va cua."""
    doors = _door_segs(floor) if floor else []
    links = []
    for i, a in enumerate(rooms):
        for b in rooms[i + 1:]:
            kinds = {a.get("type"), b.get("type")}
            if kinds & OPEN_SPACES and kinds <= COMMON_ROOMS and _shared_edge(a, b) >= 0.8:
                seg = _shared_segment(a, b)
                if seg and not _has_door(seg, doors):
                    links.append((a, b, seg))
    return links


def _void_links(rooms, floor=None):
    """Gieng troi / o thong tang giap phong chung: [(o thong, phong, canh chung)]. Tang 1 di qua duoc, tang tren la lan can."""
    doors = _door_segs(floor) if floor else []
    links = []
    for v in rooms:
        if v.get("type") != "void":
            continue
        for r in rooms:
            if r is not v and r.get("type") in COMMON_ROOMS and r.get("type") != "stairs" and _shared_edge(v, r) >= 0.8:
                seg = _shared_segment(v, r)
                if seg and not _has_door(seg, doors):
                    links.append((v, r, seg))
    return links


def _walk_links(rooms, lower_floor, has_upper, floor=None):
    """Cap phong di bo qua lai duoc khong can cua: canh thong mo het chieu cao it nhat STAIR_GAP (khong tinh lan can)."""
    holes = {}
    _open_link_holes(holes, rooms, lower_floor, 3.0, has_upper, floor=floor)
    out = []
    for a, b, seg in _open_links(rooms, floor) + _void_links(rooms, floor):
        axis, pos, lo, hi = seg
        free = sum(max(0.0, min(e, hi) - max(s, lo)) for s, e, z0, _z1 in holes.get((axis, round(pos, 4)), []) if z0 == 0.0)
        if free >= STAIR_GAP - EPS:
            out.append((a, b, seg))
    return out


def _grid(*rect_lists):
    """Luoi o tu moi canh phong: (xs, ys) da sap xep."""
    xs = sorted({round(float(v), 4) for rl in rect_lists for r in rl for v in (r["x"], r["x"] + r["w"])})
    ys = sorted({round(float(v), 4) for rl in rect_lists for r in rl for v in (r["y"], r["y"] + r["d"])})
    return xs, ys


def _cells(rects, xs, ys):
    """O luoi (i, j) co tam nam trong mot trong cac phong."""
    out = set()
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            cx, cy = (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2
            if any(r["x"] < cx < r["x"] + r["w"] and r["y"] < cy < r["y"] + r["d"] for r in rects):
                out.add((i, j))
    return out


def _cover_rects(cells, xs, ys):
    """Chia tap o thanh cac hinh chu nhat khong chong nhau: [(x0, y0, x1, y1)]."""
    runs = []  # [i0, i1, j0, j1]
    for j in range(len(ys) - 1):
        i = 0
        while i < len(xs) - 1:
            if (i, j) not in cells:
                i += 1
                continue
            i0 = i
            while (i, j) in cells:
                i += 1
            prev = next((r for r in runs if r[0] == i0 and r[1] == i and r[3] == j), None)
            if prev:
                prev[3] = j + 1
            else:
                runs.append([i0, i, j, j + 1])
    return [(xs[i0], ys[j0], xs[i1], ys[j1]) for i0, i1, j0, j1 in runs]


def _roof_rects(cells, xs, ys):
    """Phu tap o bang it khoi mai nhat (cho phep chong nhau): moi lan lay hinh chu nhat phu them nhieu dien tich nhat.
    shortcut: tham lam, co the du khoi voi mat bang rat ngoan ngoeo; them roof.blocks neu can tu chon khoi."""
    area = lambda i, j: (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j])
    left, out = set(cells), []
    nx, ny = len(xs) - 1, len(ys) - 1
    while left:
        best = None
        for i0 in range(nx):
            for j0 in range(ny):
                if (i0, j0) not in cells:
                    continue
                for i1 in range(i0 + 1, nx + 1):
                    if (i1 - 1, j0) not in cells:
                        break
                    for j1 in range(j0 + 1, ny + 1):
                        if any((i, j1 - 1) not in cells for i in range(i0, i1)):
                            break
                        block = [(i, j) for i in range(i0, i1) for j in range(j0, j1)]
                        gain = sum(area(*c) for c in block if c in left)
                        size = sum(area(*c) for c in block)
                        if gain > EPS and (best is None or (gain, size) > best[0]):
                            best = ((gain, size), (i0, i1, j0, j1), block)
        _score, (i0, i1, j0, j1), block = best
        left -= set(block)
        out.append((xs[i0], ys[j0], xs[i1], ys[j1]))
    return out


def _boundary(cells, xs, ys, skip=frozenset()):
    """Canh ngoai cua tap o (ke voi o khong thuoc `cells` va khong thuoc `skip`): [(truc, vi tri, a, b)]."""
    lines = {}
    for i, j in cells:
        for n, key, span in (((i - 1, j), ("v", xs[i]), (ys[j], ys[j + 1])), ((i + 1, j), ("v", xs[i + 1]), (ys[j], ys[j + 1])),
                             ((i, j - 1), ("h", ys[j]), (xs[i], xs[i + 1])), ((i, j + 1), ("h", ys[j + 1]), (xs[i], xs[i + 1]))):
            if n not in cells and n not in skip:
                lines.setdefault(key, []).append(span)
    return [(axis, pos, a, b) for (axis, pos), spans in sorted(lines.items()) for a, b in _merge(spans)]


def _stair_dir(r):
    """Huong di len: '+y' (tu canh truoc ra canh sau), '-y', '+x', '-x'. Mac dinh theo canh dai."""
    up = r.get("up")
    if up in STAIR_DIRS:
        return up
    return "+y" if float(r["d"]) >= float(r["w"]) else "+x"


def _stair_frame(r, up):
    """Khung rieng cua o thang: u chay theo huong len (0..L), v ngang (0..W); map(u, v) -> (x, y) mat bang."""
    x0, y0 = float(r["x"]), float(r["y"])
    x1, y1 = x0 + float(r["w"]), y0 + float(r["d"])
    if up == "+y":
        length, width, m = y1 - y0, x1 - x0, lambda u, v: (x0 + v, y0 + u)
    elif up == "-y":
        length, width, m = y1 - y0, x1 - x0, lambda u, v: (x1 - v, y1 - u)
    elif up == "+x":
        length, width, m = x1 - x0, y1 - y0, lambda u, v: (x0 + u, y1 - v)
    else:
        length, width, m = x1 - x0, y1 - y0, lambda u, v: (x1 - u, y0 + v)
    if r.get("mirror"):
        base = m
        m = lambda u, v: base(u, width - v)
    return length, width, m


def _stair_plan(r):
    """Cac ve thang, chieu nghi va cho buoc len / buoc ra cua o thang (thang thang, chu L, chu U).
    ve = (u0, u1, v0, v1, huong 'u+' | 'u-' | 'v+', z0, z1) voi z la ti le chieu cao tang.
    Tra ve dict: flights, landings [(u0, u1, v0, v1, z)], entry / arrival [doan canh mat bang (truc, vi tri, a, b)]."""
    up = _stair_dir(r)
    length, width, m = _stair_frame(r, up)
    zone = min(STAIR_ZONE, length)
    shape = r.get("shape", "straight")
    if shape == "U" and width >= 1.8 - EPS:
        half = width / 2
        land = min(half, length / 2)
        run = length - land
        flights = [(0, run, 0, half, "u+", 0.0, 0.5), (0, run, half, width, "u-", 0.5, 1.0)]
        landings = [(run, length, 0, width, 0.5)]
        entry = [("u", 0, 0, half), ("v", 0, 0, min(zone, run))]
        arrival = [("u", 0, half, width), ("v", width, 0, min(zone, run))]
    elif shape == "L" and width >= 1.8 - EPS:
        fw = max(0.9, min(float(r.get("flight_width", 1.0)), width / 2, length / 2))
        run1, run2 = length - fw, width - fw
        mid = run1 / (run1 + run2)
        flights = [(0, run1, 0, fw, "u+", 0.0, mid), (run1, length, fw, width, "v+", mid, 1.0)]
        landings = [(run1, length, 0, fw, mid)]
        entry = [("u", 0, 0, fw), ("v", 0, 0, min(zone, run1))]
        arrival = [("v", width, run1, length), ("u", length, max(fw, width - zone), width)]
    else:
        flights = [(0, length, 0, width, "u+", 0.0, 1.0)]
        landings = []
        entry = [("u", 0, 0, width), ("v", 0, 0, zone), ("v", width, 0, zone)]
        arrival = [("u", length, 0, width), ("v", 0, length - zone, length), ("v", width, length - zone, length)]

    def world(seg):
        kind, c, a, b = seg
        (xa, ya), (xb, yb) = (m(c, a), m(c, b)) if kind == "u" else (m(a, c), m(b, c))
        if abs(xa - xb) < EPS:
            return ("v", round(xa, 6), min(ya, yb), max(ya, yb))
        return ("h", round(ya, 6), min(xa, xb), max(xa, xb))

    def rect(u0, u1, v0, v1):
        (xa, ya), (xb, yb) = m(u0, v0), m(u1, v1)
        return min(xa, xb), max(xa, xb), min(ya, yb), max(ya, yb)

    return {"up": up, "map": m, "rect": rect, "flights": flights, "landings": landings,
            "entry": [world(sg) for sg in entry], "arrival": [world(sg) for sg in arrival]}


def _access_text(r, which):
    plan = _stair_plan(r)
    return ", ".join(f"{'y' if axis == 'h' else 'x'}={pos:g} tu {a:g} den {b:g}" for axis, pos, a, b in plan[which])


def _touches(seg, targets):
    """Doan `seg` trung duong va chong len it nhat STAIR_GAP voi mot doan trong `targets`."""
    axis, pos, a, b = seg
    return any(axis == t[0] and abs(pos - t[1]) < EPS and min(b, t[3]) - max(a, t[2]) >= STAIR_GAP - EPS for t in targets)


def _stair_access(floor, r, which, plan_from=None):
    """which = 'entry' (chan thang o tang nay) hoac 'arrival' (dau tren cua ve thang tu tang duoi len, hinh hoc theo `plan_from`)."""
    rooms = _valid_rooms(floor.get("rooms", []))
    targets = _stair_plan(plan_from or r)[which]
    by_id = {room["id"]: room for room in rooms}
    for o in floor.get("openings", []):
        if o.get("kind", "door") not in DOOR_KINDS or o.get("room") not in by_id or o.get("side") not in SIDE_NAMES:
            continue
        seg = _opening_segment(by_id[o["room"]], o)
        if _segment_on_room_edge(seg, r) and _touches(seg, targets):
            return True
    return any(_touches(seg, targets) for a, b, seg in _open_links(rooms, floor) if r["id"] in (a["id"], b["id"]))


def _validate_layout_quality(fi, floor, lower_floor, door_segments, errors, warnings, has_upper=True, is_ground=None):
    """Lối đi tới mọi phòng, cửa sổ, khoảng trống thừa và phần tầng trên chìa ra ngoài tầng dưới."""
    rooms = _valid_rooms(floor.get("rooms", []))
    if not rooms:
        return
    # Do thi: phong noi nhau qua cua di (cua nam tren canh cua ca hai phong) hoac hanh lang/cau thang thong nhau.
    by_id = {r["id"]: r for r in rooms}
    links = {r["id"]: set() for r in rooms}
    steps = []  # (phong, o thang, canh chung): cho buoc len / buoc ra cua cau thang
    for seg in door_segments:
        touching = [r for r in rooms if _segment_on_room_edge(seg, r)]
        for a in touching:
            links[a["id"]].update(t["id"] for t in touching if t is not a)
        for s in (r for r in touching if r.get("type") == "stairs"):
            fronts = [_stair_plan(x)[k][0] for x, k in ((s, "entry"), (s, "arrival"))]
            if not _touches(seg, fronts):
                errors.append(f"Tang {fi}: cua o canh ben o thang {s['id']} ({'y' if seg[0] == 'h' else 'x'}={seg[1]:g}) mo vao than cau thang, "
                              f"buoc qua la vap bac thang (doi cua sang canh khac cua phong)")
            steps.extend((r, s, seg) for r in touching if r is not s)
    for a, b, seg in _walk_links(rooms, lower_floor, has_upper, floor):
        links[a["id"]].add(b["id"])
        links[b["id"]].add(a["id"])
        steps.extend((r, s, seg) for r, s in ((a, b), (b, a)) if s.get("type") == "stairs")
    if is_ground is None:
        is_ground = fi == 1
    ys_front = min(r["y"] for r in rooms)
    if is_ground:  # cua chinh: cua o mat tien hoac o hien mat tien (khong tinh cua gara)
        start = set()
        for seg in door_segments:
            touching = [r for r in rooms if _segment_on_room_edge(seg, r)]
            porch = [r for r in touching if r.get("type") == "porch" and abs(r["y"] - ys_front) < EPS]
            if porch or len(touching) == 1 and seg[0] == "h" and abs(seg[1] - ys_front) < EPS:
                start.update(r["id"] for r in touching if r.get("type") not in ("garage", "porch"))
    else:
        lower_stairs = [r for r in _valid_rooms(lower_floor.get("rooms", [])) if r.get("type") == "stairs"] if lower_floor else []
        start = {r["id"] for r, s, seg in steps for low in lower_stairs
                 if all(abs(float(low[k]) - float(s[k])) < 0.05 for k in "xywd") and _touches(seg, _stair_plan(low)["arrival"])}

    def reach(blocked):
        """Cac phong di bo toi duoc ma khong di xuyen qua phong loai `blocked` (cau thang khong bao gio la loi di xuyen)."""
        seen, todo = set(start), list(start)
        while todo:
            here = todo.pop()
            if here not in start and by_id[here].get("type") in blocked:
                continue
            for nxt in links[here] - seen:
                seen.add(nxt)
                todo.append(nxt)
        return seen

    if start:
        seen, origin = reach({"stairs"}), "cua chinh" if is_ground else "cau thang"
        for r in rooms:
            if r["id"] not in seen and r.get("type") not in ("void", "stairs"):
                errors.append(f"Tang {fi}: khong di toi duoc phong {r['id']} tu {origin} (kiem tra cua giua cac phong; "
                              f"khong duoc di xuyen qua o thang hay vong ra san)")
        if has_upper:
            for s in (r for r in rooms if r.get("type") == "stairs"):
                doors_up = [r["id"] for r, x, seg in steps if x is s and _touches(seg, _stair_plan(s)["entry"])]
                if doors_up and not set(doors_up) & seen:
                    errors.append(f"Tang {fi}: khong di toi duoc chan cau thang {s['id']} tu {origin}")
        public = reach({"stairs"} | PRIVATE_ROOMS)
        for r in rooms:
            if r["id"] in seen - public and r.get("type") in ("living", "kitchen", "dining", "bedroom"):
                errors.append(f"Tang {fi}: vao {r['id']} phai di xuyen qua phong rieng (ngu, wc, kho, giat, gara...); can loi vao tu sanh/hanh lang")
        living = {r["id"] for r in rooms if r.get("type") == "living"}
        if is_ground and living and not any(x in living or links[x] & living for x in start):
            errors.append(f"Tang {fi}: phong khach khong giap cua chinh hay sanh don (khach vao nha phai gap phong khach truoc)")
    floor_area = sum(r["w"] * r["d"] for r in rooms if r.get("type") not in ("void", "balcony", "porch"))
    hall_area = sum(r["w"] * r["d"] for r in rooms if r.get("type") == "hall")
    if floor_area > 60 and hall_area > MAX_HALL_SHARE * floor_area:
        warnings.append(f"Tang {fi}: sanh/hanh lang chiem {hall_area:.0f}m2 = {hall_area / floor_area:.0%} san, lang phi (nen duoi {MAX_HALL_SHARE:.0%})")
    for r in rooms:
        if r.get("type") == "balcony":
            spans = [b - a for _axis, _pos, a, b, _sign in _exterior_spans(r, rooms)]
            if spans and max(spans) < 0.6 * max(r["w"], r["d"]):
                warnings.append(f"Tang {fi}: ban cong {r['id']} bi kep giua cac phong, chi ho {max(spans):g}m ra ngoai (dua ra mat tien/hong nha)")
    windows = {o.get("room") for o in floor.get("openings", []) if o.get("kind") in ("window", "glass-wall")}
    for r in rooms:
        if r.get("type") in NEEDS_WINDOW and r["id"] not in windows:
            warnings.append(f"Tang {fi}: {r['id']} ({r['type']}) chua co cua so")
    # Khoang trong bi phong bao quanh ma khong thuoc phong nao (nha chu L, chu U thi phan khuyet mo ra ngoai, khong tinh).
    xs, ys = _grid(rooms)
    empty = {(i, j) for i in range(len(xs) - 1) for j in range(len(ys) - 1)} - _cells(rooms, xs, ys)
    outer = {c for c in empty if c[0] in (0, len(xs) - 2) or c[1] in (0, len(ys) - 2)}
    todo = list(outer)
    while todo:
        i, j = todo.pop()
        for n in ((i - 1, j), (i + 1, j), (i, j - 1), (i, j + 1)):
            if n in empty and n not in outer:
                outer.add(n)
                todo.append(n)
    gap = sum((xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]) for i, j in empty - outer)
    if gap > 1.0:
        warnings.append(f"Tang {fi}: {gap:.1f}m2 trong khung nha khong thuoc phong nao (bo sung phong hoac thu gon khung)")
    if lower_floor is not None:
        lower = _valid_rooms(lower_floor.get("rooms", []))
        for r in rooms:
            if r.get("type") == "balcony":
                continue
            free = r["w"] * r["d"] - sum(_overlap_area(r, b) for b in lower)
            if free > 0.5:
                warnings.append(f"Tang {fi}: {r['id']} co {free:.1f}m2 nam ngoai tang duoi (khong co gi do ben duoi)")


DOOR_CLEARANCE = 0.8
OPEN_EDGE_CLEARANCE = 0.6
ESSENTIALS = {"bedroom": ("giuong-", "giuong"), "kitchen": ("tu-bep", "tu bep"), "wc": ("bon-cau", "bon cau"),
              "living": ("sofa", "sofa"), "dining": ("ban-an", "ban an"), "worship": ("ban-tho", "ban tho"),
              "laundry": ("may-giat", "may giat"), "garage": ("xe-oto", "xe o to")}
# So mon do toi thieu theo dien tich: loai phong -> [(tu m2, so mon)]; quy chuan day du o noi-that-chuan.md.
FURNISH_MIN = {"living": [(0, 3), (10, 5), (16, 7), (24, 9)], "bedroom": [(0, 2), (9, 4), (14, 5)], "kitchen": [(0, 4), (10, 7)],
               "dining": [(0, 3), (8, 5)], "wc": [(0, 2), (3.5, 3)], "worship": [(0, 2)], "laundry": [(0, 1), (6, 3)],
               "storage": [(2.5, 1), (6, 2)], "garage": [(0, 1)], "hall": [(5, 1)], "balcony": [(4, 1)], "porch": [(6, 1)]}


def _validate_furniture(fi, floor, by_id, door_segments, errors, warnings, check_essentials):
    catalog = load_catalog()
    zones = [(a, pos - DOOR_CLEARANCE, b, pos + DOOR_CLEARANCE) if axis == "h" else (pos - DOOR_CLEARANCE, a, pos + DOOR_CLEARANCE, b)
             for axis, pos, a, b in door_segments]
    seen, placed, items_by_room = set(), [], {}
    for f in floor.get("furniture", []):
        label = f"Tang {fi}: noi that '{f.get('id')}'"
        key = (f.get("room"), f.get("id"))
        if key in seen:
            errors.append(f"{label} bi trung id trong phong {f.get('room')}")
        seen.add(key)
        item = catalog.get(f.get("item"))
        room = by_id.get(f.get("room"))
        if item is None:
            errors.append(f"{label}: mon '{f.get('item')}' khong co trong catalog (xem lenh catalog)")
            continue
        if room is None:
            errors.append(f"{label} tham chieu phong khong ton tai '{f.get('room')}'")
            continue
        try:
            x, y, rotation = float(f["x"]), float(f["y"]), int(f.get("rotation", 0))
        except (KeyError, TypeError, ValueError):
            errors.append(f"{label} thieu x/y hoac rotation sai kieu")
            continue
        if rotation not in (0, 90, 180, 270):
            errors.append(f"{label}: rotation phai la 0, 90, 180 hoac 270")
            continue
        items_by_room.setdefault(room["id"], []).append(f["item"])
        if room.get("type") in ("stairs", "void"):
            errors.append(f"{label} dat trong o cau thang" if room.get("type") == "stairs" else f"{label} dat trong gieng troi / o thong tang")
            continue
        if room.get("type") not in item["rooms"]:
            warnings.append(f"{label}: {item['name']} it khi dat trong phong loai {room.get('type')}")
        x0, y0, x1, y1 = _footprint(x, y, rotation, item)
        tol = 0.02
        if x0 < room["x"] - tol or y0 < room["y"] - tol or x1 > room["x"] + room["w"] + tol or y1 > room["y"] + room["d"] + tol:
            errors.append(f"{label} ({item['name']}) tran ra ngoai phong {room['id']}")
        if item.get("stack"):
            continue
        if any(_rect_overlap((x0, y0, x1, y1), z) > 0.01 for z in zones):
            errors.append(f"{label} ({item['name']}) chan cua: chua it nhat {DOOR_CLEARANCE}m truoc moi cua di")
        for other_id, other in placed:
            if _rect_overlap((x0, y0, x1, y1), other) > 0.01:
                errors.append(f"{label} chong len noi that '{other_id}'")
        placed.append((f.get("id"), (x0, y0, x1, y1)))
    if check_essentials:
        for room in by_id.values():
            need = ESSENTIALS.get(room.get("type"))
            if need and not any(code.startswith(need[0]) for code in items_by_room.get(room["id"], [])):
                warnings.append(f"Tang {fi}: phong {room['id']} chua co {need[1]}")
            rule = FURNISH_MIN.get(room.get("type"))
            if not rule or not all(isinstance(room.get(k), (int, float)) for k in "xywd"):
                continue
            area, narrow = room["w"] * room["d"], min(room["w"], room["d"])
            if room.get("type") in ("hall", "balcony") and narrow < 1.4:
                continue  # hanh lang, ban cong hep: giu loi di, khong ep dat do
            need_count = max((n for limit, n in rule if area >= limit), default=0)
            have = len(items_by_room.get(room["id"], []))
            if have < need_count:
                warnings.append(f"Tang {fi}: phong {room['id']} ({room.get('type')}, {area:.1f}m2) moi co {have} mon do, "
                                f"can it nhat {need_count} (xem noi-that-chuan.md)")


def _rect_overlap(a, b):
    return max(0.0, min(a[2], b[2]) - max(a[0], b[0])) * max(0.0, min(a[3], b[3]) - max(a[1], b[1]))


def _footprint(x, y, rotation, item):
    w, d = (item["d"], item["w"]) if rotation % 180 == 90 else (item["w"], item["d"])
    return (x - w / 2, y - d / 2, x + w / 2, y + d / 2)


# ---------------------------------------------------------------- thu vien noi that (OBJ + MTL)

ASSETS = Path(__file__).resolve().parent.parent / "assets" / "furniture"
EXAMPLES = Path(__file__).resolve().parent.parent / "examples"
_OBJ_CACHE = {}
_CATALOG = None


# Mau that theo ten vat lieu cua bo Kenney (go goc cam nhat, vai do choi); moi mon doi rieng bang "tones" trong catalog.json.
FURNITURE_TONES = {"wood": "#b98d62", "woodDark": "#6f4d33", "carpet": "#7d8b94", "carpetWhite": "#f4f1ea", "carpetDarker": "#5c6b75",
                   "metal": "#b9bec2", "metalLight": "#e6e8e9", "metalMedium": "#6d7478", "metalDark": "#3a3f43",
                   "plant": "#4c7f43", "lamp": "#fff0c8", "glass": "#b8d4d8", "_defaultMat": "#f2efe8"}


def load_obj(path, tones=None):
    """Doc OBJ thanh [(rgb, poly)] theo toa do goc cua file; mau: tones cua mon > FURNITURE_TONES > Kd trong MTL."""
    path = Path(path)
    cache_key = (path, tuple(sorted((tones or {}).items())))
    if cache_key in _OBJ_CACHE:
        return _OBJ_CACHE[cache_key]
    tones = dict(FURNITURE_TONES, **(tones or {}))
    verts, faces, kd = [], [], {}
    current = (0.8, 0.8, 0.8)
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        tok = line.split()
        if not tok:
            continue
        if tok[0] == "mtllib":
            mtl = path.parent / " ".join(tok[1:])
            name = None
            for mline in mtl.read_text(encoding="utf-8", errors="replace").splitlines() if mtl.exists() else []:
                m = mline.split()
                if m and m[0] == "newmtl":
                    name = " ".join(m[1:])
                elif m and m[0] == "Kd" and name:
                    kd[name] = tuple(min(1.0, max(0.0, float(c))) for c in m[1:4])
        elif tok[0] == "v":
            verts.append(tuple(float(c) for c in tok[1:4]))
        elif tok[0] == "usemtl":
            name = " ".join(tok[1:])
            current = _hex_rgb(tones.get(name)) or kd.get(name, (0.8, 0.8, 0.8))
        elif tok[0] == "f":
            idx = [int(t.split("/")[0]) for t in tok[1:]]
            faces.append((current, [verts[i - 1] if i > 0 else verts[i] for i in idx]))
    _OBJ_CACHE[cache_key] = faces
    return faces


def load_catalog():
    """Catalog noi that; them d (chieu sau) va h (chieu cao) tinh tu ti le OBJ."""
    global _CATALOG
    if _CATALOG is None:
        raw = json.loads((ASSETS / "catalog.json").read_text(encoding="utf-8"))
        catalog = {}
        for code, item in raw.items():
            if code.startswith("_"):
                continue
            pts = [p for _, poly in load_obj(ASSETS / item["obj"]) for p in poly]
            lo = [min(p[i] for p in pts) for i in range(3)]
            hi = [max(p[i] for p in pts) for i in range(3)]
            sx = item["w"] / (hi[0] - lo[0])
            sy = item["h"] / (hi[1] - lo[1]) if "h" in item else sx
            catalog[code] = dict(item, d=round((hi[2] - lo[2]) * sx, 3), h=round((hi[1] - lo[1]) * sy, 3),
                                 sx=sx, sy=sy, lo=lo, hi=hi)
        _CATALOG = catalog
    return _CATALOG


def catalog_table():
    rows = ["ma | ten | rong x sau x cao (m) | loai phong | ghi chu"]
    for code, item in load_catalog().items():
        note = ("dat tren cao z=%gm, " % item["z"] if item.get("z") else "") + ("khong kiem tra chong lan" if item.get("stack") else "")
        rows.append(f"{code} | {item['name']} | {item['w']:.2f} x {item['d']:.2f} x {item['h']:.2f} | {', '.join(item['rooms'])} | {note.rstrip(', ')}")
    return "\n".join(rows)


def _place_furniture(part, item, f, base):
    """Dat mon do: tam hop bao tai (x, y), day tren san (+ z cua catalog).
    Mat truoc cua OBJ Kenney huong -Z; quay 180 do (px = -x, py = z) de rotation 0 nhin ra mat tien."""
    lo, hi = item["lo"], item["hi"]
    cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
    theta = math.radians(int(f.get("rotation", 0)))
    c, s = math.cos(theta), math.sin(theta)
    z0 = base + float(item.get("z", 0.0))
    override = _hex_rgb(f.get("color"))
    for rgb, poly in load_obj(ASSETS / item["obj"], item.get("tones")):
        pts = []
        for x, y, z in poly:
            px, py = -(x - cx) * item["sx"], (z - cz) * item["sx"]
            pts.append(_w(float(f["x"]) + px * c - py * s, float(f["y"]) + px * s + py * c, z0 + (y - lo[1]) * item["sy"]))
        part["faces"].append((override or rgb, pts))


def _overlap_area(a, b):
    try:
        ox = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
        oy = min(a["y"] + a["d"], b["y"] + b["d"]) - max(a["y"], b["y"])
    except (KeyError, TypeError):
        return 0.0
    return max(0.0, ox) * max(0.0, oy)


def _opening_segment(room, o):
    """Doan thang cua lo cua: ('h', y, x0, x1) hoac ('v', x, y0, y1)."""
    x, y, w, d = (float(room[k]) for k in ("x", "y", "w", "d"))
    s = float(o.get("offset", 0))
    width = float(o.get("width", 0.9))
    side = o["side"]
    if side == "front":
        return ("h", y, x + s, x + s + width)
    if side == "back":
        return ("h", y + d, x + s, x + s + width)
    if side == "left":
        return ("v", x, y + s, y + s + width)
    return ("v", x + w, y + s, y + s + width)


def _segment_on_room_edge(seg, r):
    x, y, w, d = (float(r[k]) for k in ("x", "y", "w", "d"))
    axis, pos, a, b = seg
    if axis == "h":
        return (abs(pos - y) < EPS or abs(pos - (y + d)) < EPS) and a >= x - EPS and b <= x + w + EPS
    return (abs(pos - x) < EPS or abs(pos - (x + w)) < EPS) and a >= y - EPS and b <= y + d + EPS


# ---------------------------------------------------------------- bo phan va hinh hoc
# Moi bo phan (part) = {"id", "name", "category", "floor", "room", "order", "faces"}, faces = [(rgb, poly)].
# poly dung he toa do glTF: X = x mat bang, Y = chieu cao, Z = -y (nha keo dai ve -Z, mat tien o Z = 0).

CATEGORY_RANK = {"floor": 0, "wall": 1, "trim": 1, "column": 1, "door": 2, "glass": 2, "frame": 2, "stairs": 3, "railing": 3,
                 "furniture": 4, "garden": 5, "fence": 6}
SIDE_NAMES = {"front": "mặt tiền", "back": "mặt sau", "left": "trái", "right": "phải"}


def _n(v):
    return f"{v:g}".replace(".", "p").replace("-", "m")


def _hex_rgb(value):
    if not (isinstance(value, str) and len(value) == 7 and value.startswith("#")):
        return None
    try:
        return tuple(int(value[i:i + 2], 16) / 255 for i in (1, 3, 5))
    except ValueError:
        return None


GARDEN_OWN_COLOR = {"leaves", "bark", "water", "soil", "paving", "gravel"}  # chat lieu giu mau rieng khi doi mau "San vuon"


def _linear(c):
    """sRGB 0..1 -> tuyen tinh (baseColorFactor cua glTF la tuyen tinh; khong doi thi mo hinh hien mau nhat hon da chon)."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def resolve_color(part, colors):
    """Mau ghi de cua bo phan (rgb 0..1), hoac None neu giu mau goc cua tung mat."""
    colors = colors or {}
    own = _hex_rgb(colors.get("parts", {}).get(part["id"]))
    if own is None and part["category"] == "garden" and part.get("material") in GARDEN_OWN_COLOR:
        return None
    return own or _hex_rgb(colors.get("categories", {}).get(part["category"]))


def _new_part(parts, pid, name, category, floor, room=None, order=None, material=None):
    """material: goi y chat lieu cho trinh xem va Blender (grass, paving, gravel, stone, plaster, water, leaves, bark...)."""
    if order is None:
        order = (floor - 1) * 10 + CATEGORY_RANK[category]
    part = {"id": pid, "name": name, "category": category, "floor": floor, "room": room, "order": order, "faces": []}
    if material:
        part["material"] = material
    parts.append(part)
    return part


def _w(x, y, z):
    return (round(x, 4), round(z, 4), round(-y, 4))


def _normal(poly):
    nx = ny = nz = 0.0
    for i, (x1, y1, z1) in enumerate(poly):
        x2, y2, z2 = poly[(i + 1) % len(poly)]
        nx += (y1 - y2) * (z1 + z2)
        ny += (z1 - z2) * (x1 + x2)
        nz += (x1 - x2) * (y1 + y2)
    length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
    return (nx / length, ny / length, nz / length)


def _outward(poly, center):
    n = _normal(poly)
    cx = sum(p[0] for p in poly) / len(poly) - center[0]
    cy = sum(p[1] for p in poly) / len(poly) - center[1]
    cz = sum(p[2] for p in poly) / len(poly) - center[2]
    return poly if n[0] * cx + n[1] * cy + n[2] * cz >= 0 else poly[::-1]


def box(part, rgb, x0, x1, y0, y1, z0, z1):
    if x1 - x0 < EPS or y1 - y0 < EPS or z1 - z0 < EPS:
        return
    c = _w((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    quads = [
        [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)],
        [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)],
        [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)],
        [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)],
        [(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)],
        [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)],
    ]
    for q in quads:
        part["faces"].append((rgb, _outward([_w(*p) for p in q], c)))


def _facade(layout):
    """Thong so mat tien: mac dinh theo phong cach, ghi de bang facade.railing / band / canopy."""
    f = layout.get("facade") or {}
    style = dict(FACADE_STYLES.get(f.get("style", "basic"), FACADE_STYLES["basic"]))
    if f.get("railing") in RAILING_STYLES:
        style["railing"] = f["railing"]
    for key in ("band", "canopy"):
        if isinstance(f.get(key), bool):
            style[key] = f[key]
    style["column"] = f.get("column") if f.get("column") in COLUMN_STYLES else COLUMN_BY_FACADE.get(f.get("style", "basic"), "square")
    return style


def _slab(part, rgb, axis, pos, a, b, off0, off1, z0, z1):
    """Hop chay doc mot duong tuong: a..b theo chieu tuong, off0..off1 lech khoi tim tuong."""
    if axis == "h":
        box(part, rgb, a, b, pos + off0, pos + off1, z0, z1)
    else:
        box(part, rgb, pos + off0, pos + off1, a, b, z0, z1)


def _bar(part, rgb, p0, p1, w, h):
    """Thanh tiet dien w x h (h theo chieu dung) noi hai diem (x, y, z) mat bang; dung cho tay vin, dam thang."""
    (x0, y0, z0), (x1, y1, z1) = p0, p1
    length = math.hypot(x1 - x0, y1 - y0) or 1.0
    sx, sy = -(y1 - y0) / length * w / 2, (x1 - x0) / length * w / 2
    ring = lambda x, y, z: [(x - sx, y - sy, z), (x + sx, y + sy, z), (x + sx, y + sy, z + h), (x - sx, y - sy, z + h)]
    a, b = ring(x0, y0, z0), ring(x1, y1, z1)
    center = _w((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2 + h / 2)
    for q in (a, b, [a[0], a[1], b[1], b[0]], [a[1], a[2], b[2], b[1]], [a[2], a[3], b[3], b[2]], [a[3], a[0], b[0], b[3]]):
        part["faces"].append((rgb, _outward([_w(*v) for v in q], center)))


def _lazy(parts, cache, pid, name, category, floor, room=None):
    """Tao bo phan khi can lan dau (tranh bo phan rong)."""
    if pid not in cache:
        cache[pid] = _new_part(parts, pid, name, category, floor, room)
    return cache[pid]


def _out_sign(side):
    """Huong ra khoi phong cua canh `side`: -1 (ve phia toa do nho) hoac +1."""
    return -1 if side in ("front", "left") else 1


def _is_exterior(seg, rooms, owner):
    return not any(r is not owner and _segment_on_room_edge(seg, r) for r in rooms)


def _exterior_spans(r, rooms):
    """Cac doan canh cua phong `r` khong giap phong nao khac cung tang: [(truc, vi tri, a, b, huong ra)]."""
    x, y, w, d = r["x"], r["y"], r["w"], r["d"]
    out = []
    for axis, pos, a, b, sign in (("h", y, x, x + w, -1), ("h", y + d, x, x + w, 1), ("v", x, y, y + d, -1), ("v", x + w, y, y + d, 1)):
        covered = []
        for o in rooms:
            if o is r:
                continue
            seg = _shared_segment(r, o)
            if seg and seg[0] == axis and abs(seg[1] - pos) < EPS:
                covered.append((seg[2], seg[3]))
        cursor = a
        for s0, e0 in _merge(covered):
            if s0 > cursor + EPS:
                out.append((axis, pos, cursor, s0, sign))
            cursor = max(cursor, e0)
        if b > cursor + EPS:
            out.append((axis, pos, cursor, b, sign))
    return out


def _window(frame, glass, trim, fr_rgb, axis, pos, a, b, z0, z1, out, canopy):
    """Cua so: kinh, khung 4 canh, do giua khi rong, bau cua nho ra ngoai, o vang (tuy phong cach)."""
    F = FRAME_W
    _wall_piece(glass, CATEGORY_COLORS["glass"], axis, pos, a + F, b - F, z0 + F, z1 - F, t=0.012)
    for s0, s1, h0, h1 in ((a, a + F, z0, z1), (b - F, b, z0, z1), (a + F, b - F, z1 - F, z1), (a + F, b - F, z0, z0 + F)):
        _slab(frame, fr_rgb, axis, pos, s0, s1, -0.05, 0.05, h0, h1)
    if b - a > 1.2:
        m = (a + b) / 2
        _slab(frame, fr_rgb, axis, pos, m - F / 2, m + F / 2, -0.04, 0.04, z0 + F, z1 - F)
    lo, hi = sorted((0.0, out * (WALL_T / 2 + 0.07)))
    _slab(trim, CATEGORY_COLORS["trim"], axis, pos, a - 0.05, b + 0.05, lo, hi, z0 - 0.05, z0)
    if canopy:
        lo, hi = sorted((out * WALL_T / 2, out * (WALL_T / 2 + 0.45)))
        _slab(trim, CATEGORY_COLORS["trim"], axis, pos, a - 0.15, b + 0.15, lo, hi, z1 + 0.15, z1 + 0.23)


def _door(leaf, frame, fr_rgb, axis, pos, a, b, z0, z1, garage):
    """Cua di: khung bao, canh co pano noi va tay nam (2 canh khi rong); cua gara la cua cuon co ranh ngang."""
    F = FRAME_W
    for s0, s1, h0, h1 in ((a, a + F, z0, z1), (b - F, b, z0, z1), (a + F, b - F, z1 - F, z1)):
        _slab(frame, fr_rgb, axis, pos, s0, s1, -0.09, 0.09, h0, h1)
    rgb = CATEGORY_COLORS["door"]
    if garage:
        z, k = z0, 0
        while z < z1 - F - EPS:
            top = min(z + 0.12, z1 - F)
            t = 0.035 if k % 2 else 0.02
            _slab(leaf, rgb, axis, pos, a + F, b - F, -t, t, z, top)
            z, k = top, k + 1
        return
    mid = (a + b) / 2
    leaves = [(a + F, b - F, b - F - 0.1)] if b - a <= 1.25 else [(a + F, mid - 0.005, mid - 0.08), (mid + 0.005, b - F, mid + 0.08)]
    for s0, e0, handle in leaves:
        _slab(leaf, rgb, axis, pos, s0, e0, -0.02, 0.02, z0, z1 - F)
        inset = min(0.12, (e0 - s0) * 0.18)
        for h0, h1 in ((z0 + 0.15, z0 + (z1 - z0) * 0.45), (z0 + (z1 - z0) * 0.52, z1 - F - 0.15)):
            for lo, hi in ((-0.032, -0.02), (0.02, 0.032)):
                _slab(leaf, rgb, axis, pos, s0 + inset, e0 - inset, lo, hi, h0, h1)
        _slab(frame, HANDLE_RGB, axis, pos, handle - 0.015, handle + 0.015, -0.07, 0.07, z0 + 0.95, z0 + 1.1)


def _glass_wall(frame, glass, fr_rgb, axis, pos, a, b, z0, z1):
    """Vach kinh tu san len gan tran: khung bao, do dung moi <= 1.2m, mot thanh ngang o 2.4m neu cao."""
    F = FRAME_W
    _wall_piece(glass, CATEGORY_COLORS["glass"], axis, pos, a + F, b - F, z0 + F, z1 - F, t=0.012)
    for s0, s1, h0, h1 in ((a, a + F, z0, z1), (b - F, b, z0, z1), (a + F, b - F, z1 - F, z1), (a + F, b - F, z0, z0 + F)):
        _slab(frame, fr_rgb, axis, pos, s0, s1, -0.06, 0.06, h0, h1)
    n = max(1, math.ceil((b - a) / 1.2))
    for k in range(1, n):
        m = a + (b - a) * k / n
        _slab(frame, fr_rgb, axis, pos, m - F / 2, m + F / 2, -0.05, 0.05, z0 + F, z1 - F)
    if z1 - z0 > 2.8:
        _slab(frame, fr_rgb, axis, pos, a + F, b - F, -0.05, 0.05, z0 + 2.4, z0 + 2.4 + F)


def _porch_columns(a, b, doors, every=3.0, clear=0.4, gap=1.5):
    """Vi tri cot hien tren canh a..b; cot nao chan truoc cua thi thay bang hai cot hai ben cua (hien hep thi bo)."""
    n = max(1, math.ceil((b - a) / every))
    out = [a, b]
    for k in range(1, n):
        at = a + (b - a) * k / n
        hit = next(((s, e) for s, e in doors if s - clear < at < e + clear), None)
        for t in ([at] if hit is None else [hit[0] - clear, hit[1] + clear]):
            if all(abs(t - o) >= gap for o in out) and not any(s - clear + EPS < t < e + clear - EPS for s, e in doors):
                out.append(t)
    return sorted(round(t, 4) for t in out)


def _lathe(part, rgb, x, y, profile, sides=24):
    """Khoi tron xoay quanh truc dung: profile = [(z, ban kinh)] tu duoi len."""
    ring = lambda z, r: [_w(x + r * math.cos(2 * math.pi * k / sides), y + r * math.sin(2 * math.pi * k / sides), z) for k in range(sides)]
    rings = [ring(z, r) for z, r in profile]
    for lo, hi in zip(rings, rings[1:]):
        for k in range(sides):
            n = (k + 1) % sides
            part["faces"].append((rgb, [lo[k], lo[n], hi[n], hi[k]]))
    part["faces"].append((rgb, rings[0][::-1]))
    part["faces"].append((rgb, rings[-1]))


def _column(make, x, y, z0, z1, kind):
    """Cot hien tai (x, y). make(ten, vat lieu) tra ve bo phan theo vat lieu. Moi kieu co de va dau cot theo ti le."""
    def box(part, rgb, half, lo, hi):
        _slab(part, rgb, "h", y, x - half, x + half, -half, half, lo, hi)

    white = CATEGORY_COLORS["column"]
    if kind == "steel":  # ong thep vuong manh, ban ma tren va duoi
        part = make("cot-thep", "railing")
        box(part, STEEL_RGB, 0.06, z0, z1)
        box(part, STEEL_RGB, 0.11, z0, z0 + 0.025)
        box(part, STEEL_RGB, 0.10, z1 - 0.10, z1 - 0.08)
    elif kind == "wood":  # cot go tren tang da ke, dau cot mo rong do dam
        stone, part = make("cot-da", "stone"), make("cot-go", "wood")
        box(stone, STONE_RGB, 0.15, z0, z0 + 0.18)
        box(part, WOOD_RGB, 0.09, z0 + 0.18, z1)
        box(part, WOOD_RGB, 0.13, z1 - 0.34, z1 - 0.26)
    elif kind == "stone-base":  # than trang, be da cao 1m co go va mu cot
        stone, part = make("cot-da", "stone"), make("cot", None)
        base = min(1.0, (z1 - z0) * 0.32)
        box(stone, STONE_RGB, 0.21, z0, z0 + base)
        box(part, white, 0.25, z0 + base, z0 + base + 0.07)
        box(part, white, 0.15, z0 + base + 0.07, z1)
        box(part, white, 0.19, z1 - 0.34, z1 - 0.28)
        box(part, white, 0.21, z1 - 0.18, z1 - 0.10)
    elif kind == "round":  # cot tron thon dan, de vuong, vanh tron, dau vuong
        part = make("cot", None)
        box(part, white, 0.24, z0, z0 + 0.12)
        top = z1 - 0.10
        _lathe(part, white, x, y, [(z0 + 0.12, 0.21), (z0 + 0.20, 0.22), (z0 + 0.26, 0.18), (z0 + 0.30, 0.165), (z0 + (top - z0) * 0.4, 0.165),
                                   (top - 0.34, 0.135), (top - 0.30, 0.16), (top - 0.26, 0.135), (top - 0.16, 0.15), (top - 0.08, 0.21)])
        box(part, white, 0.23, top - 0.08, top)
    else:
        box(make("cot", None), white, 0.14, z0, z1)


def _louvers(part, seg, out, z0, z1, kind, depth, spacing):
    """Lam che nang nho ra ngoai tuong: lam dung (vertical) hoac nan ngang (horizontal)."""
    axis, pos, a, b = seg
    lo, hi = sorted((out * (WALL_T / 2 + 0.05), out * (WALL_T / 2 + 0.05 + depth)))
    if kind == "horizontal":
        z = z0 + spacing / 2
        while z < z1 - EPS:
            _slab(part, LOUVER_RGB, axis, pos, a, b, lo, hi, z - 0.02, z + 0.02)
            z += spacing
        return
    n = max(1, int((b - a) / spacing))
    for k in range(n + 1):
        at = a + (b - a) * k / n
        _slab(part, LOUVER_RGB, axis, pos, at - 0.025, at + 0.025, lo, hi, z0, z1)
    _slab(part, LOUVER_RGB, axis, pos, a, b, lo, hi, z1 - 0.08, z1)


def _railing(part, glass, style, axis, pos, a, b, z, h=RAILING_H):
    """Lan can: tru, tay vin va phan chan (song sat / kinh / con tien / tuong thap)."""
    if b - a < EPS:
        return
    if style == "wall":
        _wall_piece(part, CATEGORY_COLORS["wall"], axis, pos, a, b, z, z + h, t=0.1)
        _wall_piece(part, CATEGORY_COLORS["trim"], axis, pos, a - 0.03, b + 0.03, z + h, z + h + 0.05, t=0.14)
        return
    rgb = CATEGORY_COLORS["railing"]
    n = max(1, math.ceil((b - a) / 1.5))
    for k in range(n + 1):
        p = a + (b - a) * k / n
        _slab(part, rgb, axis, pos, p - 0.03, p + 0.03, -0.03, 0.03, z, z + h)
    _slab(part, rgb, axis, pos, a, b, -0.035, 0.035, z + h - 0.05, z + h)
    if style == "glass":
        _wall_piece(glass, CATEGORY_COLORS["glass"], axis, pos, a + 0.03, b - 0.03, z + 0.08, z + h - 0.07, t=0.012)
    elif style == "baluster":
        white = CATEGORY_COLORS["trim"]
        _slab(part, white, axis, pos, a, b, -0.06, 0.06, z, z + 0.12)
        count = max(1, int((b - a) / 0.2))
        for k in range(count):
            p = a + (b - a) * (k + 0.5) / count
            _slab(part, white, axis, pos, p - 0.035, p + 0.035, -0.035, 0.035, z + 0.12, z + h - 0.05)
    else:  # metal
        _slab(part, rgb, axis, pos, a, b, -0.015, 0.015, z + 0.08, z + 0.11)
        count = max(1, int((b - a) / 0.12))
        for k in range(count):
            p = a + (b - a) * (k + 0.5) / count
            _slab(part, rgb, axis, pos, p - 0.008, p + 0.008, -0.008, 0.008, z + 0.11, z + h - 0.05)


def _boundary_sides(cells, xs, ys):
    """Nhu _boundary nhung kem huong ra ngoai: [(truc, vi tri, a, b, +1/-1)]."""
    lines = {}
    for i, j in cells:
        for n, key, span in (((i - 1, j), ("v", xs[i], -1), (ys[j], ys[j + 1])), ((i + 1, j), ("v", xs[i + 1], 1), (ys[j], ys[j + 1])),
                             ((i, j - 1), ("h", ys[j], -1), (xs[i], xs[i + 1])), ((i, j + 1), ("h", ys[j + 1], 1), (xs[i], xs[i + 1]))):
            if n not in cells:
                lines.setdefault(key, []).append(span)
    return [(axis, pos, a, b, sign) for (axis, pos, sign), spans in sorted(lines.items()) for a, b in _merge(spans)]


def _merge(intervals):
    merged = []
    for a, b in sorted(intervals):
        if merged and a <= merged[-1][1] + EPS:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    return merged


def _wall_piece(part, rgb, axis, pos, a, b, z0, z1, t=WALL_T):
    if axis == "h":
        box(part, rgb, a, b, pos - t / 2, pos + t / 2, z0, z1)
    else:
        box(part, rgb, pos - t / 2, pos + t / 2, a, b, z0, z1)


def _room_on_line(r, axis, pos, a, b):
    if axis == "h":
        return (abs(r["y"] - pos) < EPS or abs(r["y"] + r["d"] - pos) < EPS) and r["x"] < b - EPS and r["x"] + r["w"] > a + EPS
    return (abs(r["x"] - pos) < EPS or abs(r["x"] + r["w"] - pos) < EPS) and r["y"] < b - EPS and r["y"] + r["d"] > a + EPS


def build_parts(layout):
    parts = []
    color = CATEGORY_COLORS
    plinth = float(layout.get("plinth", PLINTH))
    style = _facade(layout)
    floors = layout["floors"]
    levels = _levels(layout)
    ground = _ground_index(floors) + 1
    _plinth_parts(parts, floors[ground - 1], plinth)
    for fi, floor in enumerate(floors, start=1):
        base, height = levels[fi - 1]
        rooms = floor["rooms"]
        label = {r["id"]: r.get("name", r["id"]) for r in rooms}
        by_id = {r["id"]: r for r in rooms}
        lazy = {}
        for r in rooms:  # san; tang tren bo trong o cau thang va o thong tang / gieng troi
            if fi > 1 and r.get("type") in ("stairs", "void"):
                continue
            part = _new_part(parts, f"t{fi}-{r['id']}-san", f"T{fi} · {label[r['id']]} · Sàn", "floor", fi, r["id"],
                             material="paving" if r.get("type") in ("porch", "balcony") else None)
            box(part, color["floor"], r["x"], r["x"] + r["w"], r["y"], r["y"] + r["d"], base - SLAB_T, base)

        holes = {}
        for i, o in enumerate(floor.get("openings", [])):
            axis, pos, a, b = _opening_segment(by_id[o["room"]], o)
            kind = o.get("kind", "door")
            if kind == "window":
                z0, z1 = float(o.get("sill", WIN_SILL)), float(o.get("head", WIN_HEAD))
            elif kind == "glass-wall":
                z0, z1 = 0.0, float(o.get("head", height - 0.3))
            else:
                z0, z1 = 0.0, float(o.get("head", DOOR_H))
            z1 = min(z1, height)
            holes.setdefault((axis, round(pos, 4)), []).append((a, b, z0, z1))
            where = f"{label[o['room']]} · " + {"window": "Kính cửa sổ", "glass-wall": "Vách kính"}.get(kind, "Cửa đi") + f" ({SIDE_NAMES[o['side']]})"
            exterior = _is_exterior((axis, pos, a, b), rooms, by_id[o["room"]])
            trim = _lazy(parts, lazy, f"t{fi}-bau-o-vang", f"T{fi} · Bậu cửa, ô văng", "trim", fi)
            if kind == "glass-wall":
                part = _new_part(parts, f"t{fi}-{o['room']}-vach-kinh-{o['side']}-{i}", f"T{fi} · {where}", "glass", fi, o["room"])
                frame = _new_part(parts, f"t{fi}-{o['room']}-vach-kinh-{o['side']}-{i}-khung", f"T{fi} · {where} · Khung", "frame", fi, o["room"])
                _glass_wall(frame, part, style["frame"], axis, pos, a, b, base + z0, base + z1)
                if fi == ground and exterior and plinth > 0.05:
                    _entry_steps(parts, lazy, axis, pos, a, b, _out_sign(o["side"]), plinth, False, i, fi)
            elif kind == "window":
                part = _new_part(parts, f"t{fi}-{o['room']}-kinh-{o['side']}-{i}", f"T{fi} · {where}", "glass", fi, o["room"])
                frame = _new_part(parts, f"t{fi}-{o['room']}-kinh-{o['side']}-{i}-khung", f"T{fi} · {where} · Khung", "frame", fi, o["room"])
                _window(frame, part, trim, style["frame"], axis, pos, a, b, base + z0, base + z1, _out_sign(o["side"]),
                        style["canopy"] and exterior)
            else:
                part = _new_part(parts, f"t{fi}-{o['room']}-cua-{o['side']}-{i}", f"T{fi} · {where}", "door", fi, o["room"])
                frame = _new_part(parts, f"t{fi}-{o['room']}-cua-{o['side']}-{i}-khung", f"T{fi} · {where} · Khung", "frame", fi, o["room"])
                garage = by_id[o["room"]].get("type") == "garage" and b - a >= 2.2
                _door(part, frame, style["frame"], axis, pos, a, b, base + z0, base + z1, garage)
                if fi == ground and exterior and plinth > 0.05:
                    _entry_steps(parts, lazy, axis, pos, a, b, _out_sign(o["side"]), plinth, garage, i, fi)

        rails = []
        _open_link_holes(holes, rooms, floors[fi - 2] if fi > 1 else None, height, has_upper=fi < len(floors), rails=rails, floor=floor)
        for r in rooms:  # ban cong, lo gia: canh ngoai la lan can, khong xay tuong
            if r.get("type") == "balcony":
                for axis, pos, a, b, _sign in _exterior_spans(r, rooms):
                    holes.setdefault((axis, round(pos, 4)), []).append((a, b, 0.0, height))
                    rails.append((axis, round(pos, 4), a, b))
            elif r.get("type") == "porch":  # hien: canh ngoai de trong, co cot
                def make(suffix, material, _fi=fi):
                    part = _lazy(parts, lazy, f"t{_fi}-{suffix}", f"T{_fi} · " + {"cot-thep": "Cột hiên thép", "cot-go": "Cột hiên gỗ",
                                 "cot-da": "Bệ đá cột hiên"}.get(suffix, "Cột hiên"), "column", _fi)
                    if material:
                        part["material"] = material
                    return part

                doors = [s for s in _door_segs(floor) if _segment_on_room_edge(s, r)]
                kind = style["column"]
                beam = {"steel": ("cot-thep", "railing", STEEL_RGB), "wood": ("cot-go", "wood", WOOD_RGB)}.get(kind, ("cot", None, color["column"]))
                at_wall = lambda x, y: any(q["x"] - EPS <= x <= q["x"] + q["w"] + EPS and q["y"] - EPS <= y <= q["y"] + q["d"] + EPS
                                           for q in rooms if q is not r and q.get("type") not in ("porch", "balcony"))
                placed = set()
                for axis, pos, a, b, _sign in _exterior_spans(r, rooms):
                    holes.setdefault((axis, round(pos, 4)), []).append((a, b, 0.0, height))
                    if kind != "square":  # dam vien noi dau cot
                        half = 0.06 if kind == "steel" else 0.09
                        _slab(make(beam[0], beam[1]), beam[2], axis, pos, a, b, -half, half, base + height - (0.08 if kind == "steel" else 0.10), base + height)
                    for at in _porch_columns(a, b, [(s[2], s[3]) for s in doors if s[0] == axis]):
                        x, y = (at, pos) if axis == "h" else (pos, at)
                        spot = (round(x, 2), round(y, 2))
                        if spot not in placed and not at_wall(x, y):  # goc giap tuong nha khong can cot
                            placed.add(spot)
                            _column(make, x, y, base, base + height, kind)
                if fi == ground and plinth > 0.05:  # bac len hien o canh truoc
                    for k, (axis, pos, a, b, sign) in enumerate(_exterior_spans(r, rooms)):
                        if axis == "h" and sign < 0:
                            _entry_steps(parts, lazy, axis, pos, a + 0.3, b - 0.3, sign, plinth, False, f"hien-{r['id']}-{k}", fi)
        for k, lv in enumerate(floor.get("louvers", [])):
            room = by_id.get(lv.get("room"))
            if room is None or lv.get("side") not in SIDE_NAMES:
                continue
            edge = room["w"] if lv["side"] in ("front", "back") else room["d"]
            seg = _opening_segment(room, {"side": lv["side"], "offset": lv.get("offset", 0), "width": lv.get("width", edge)})
            _louvers(_lazy(parts, lazy, f"t{fi}-lam", f"T{fi} · Lam che nắng", "frame", fi), seg, _out_sign(lv["side"]),
                     base + float(lv.get("from", 0.0)), base + min(height, float(lv.get("to", height))),
                     lv.get("kind", "vertical"), float(lv.get("depth", 0.3)), float(lv.get("spacing", 0.35)))
        for axis, pos, a, b in rails:
            _railing(_lazy(parts, lazy, f"t{fi}-lan-can", f"T{fi} · Lan can", "railing", fi),
                     _lazy(parts, lazy, f"t{fi}-lan-can-kinh", f"T{fi} · Lan can · Kính", "glass", fi),
                     style["railing"], axis, pos, a, b, base)
        if style["band"] and fi > 1:  # go chi giua cac tang
            xs, ys = _grid(rooms)
            band = _lazy(parts, lazy, f"t{fi}-go-tang", f"T{fi} · Gờ chỉ tầng", "trim", fi)
            for axis, pos, a, b, sign in _boundary_sides(_cells(_valid_rooms(rooms), xs, ys), xs, ys):
                lo, hi = sorted((sign * WALL_T / 2, sign * (WALL_T / 2 + 0.07)))
                _slab(band, color["trim"], axis, pos, a - 0.07, b + 0.07, lo, hi, base - 0.28, base - 0.05)
        lines = {}
        for r in rooms:
            x, y, w, d = r["x"], r["y"], r["w"], r["d"]
            lines.setdefault(("h", round(y, 4)), []).append((x, x + w))
            lines.setdefault(("h", round(y + d, 4)), []).append((x, x + w))
            lines.setdefault(("v", round(x, 4)), []).append((y, y + d))
            lines.setdefault(("v", round(x + w, 4)), []).append((y, y + d))
        for (axis, pos), intervals in lines.items():
            for a, b in _merge(intervals):
                touching = " | ".join(label[r["id"]] for r in rooms if _room_on_line(r, axis, pos, a, b))
                where = f"ngang y={pos:g}" if axis == "h" else f"dọc x={pos:g}"
                part = _new_part(parts, f"t{fi}-tuong-{axis}{_n(pos)}-{_n(a)}-{_n(b)}", f"T{fi} · Tường {where} ({touching})", "wall", fi)
                spans = _flatten_holes(h for h in holes.get((axis, pos), []) if h[0] < b and h[1] > a)
                gone = lambda hole: hole[2] < EPS and hole[3] > height - EPS  # mo het chieu cao
                # dau tuong mo het (hien, ban cong): khong chua coc tuong thua o goc trong
                cursor = a if spans and spans[0][0] <= a + EPS and gone(spans[0]) else a - WALL_T / 2
                last_open = spans and spans[-1][1] >= b - EPS and gone(spans[-1])
                for s, e, z0, z1 in spans:
                    _wall_piece(part, color["wall"], axis, pos, cursor, s, base, base + height)
                    _wall_piece(part, color["wall"], axis, pos, s, e, base, base + z0)
                    _wall_piece(part, color["wall"], axis, pos, s, e, base + z1, base + height)
                    cursor = e
                if not last_open:
                    _wall_piece(part, color["wall"], axis, pos, cursor, b + WALL_T / 2, base, base + height)

        if fi < len(floors):
            for r in rooms:
                if r.get("type") == "stairs":
                    part = _new_part(parts, f"t{fi}-{r['id']}-cau-thang", f"T{fi} · Cầu thang", "stairs", fi, r["id"])
                    rail = _new_part(parts, f"t{fi}-{r['id']}-tay-vin", f"T{fi} · Cầu thang · Dầm, tay vịn", "railing", fi, r["id"])
                    _stairs(part, r, base, height, rail)

        for f in floor.get("furniture", []):
            item = load_catalog().get(f.get("item"))
            if item is None:
                continue
            part = _new_part(parts, f"t{fi}-{f['room']}-{f['id']}", f"T{fi} · {label.get(f['room'], f['room'])} · {item['name']}",
                             "furniture", fi, f["room"])
            _place_furniture(part, item, f, base)
    _terraces(parts, floors, levels, style)
    _site_parts(parts, layout)
    _roof(parts, layout, levels[-1][0] + levels[-1][1], len(floors) + 1)
    parts[:] = [p for p in parts if p["faces"]]
    return parts


def _plinth_parts(parts, ground, plinth):
    """Cot nen: khoi da duoi tang 1, nang nha cao hon san vuon."""
    if plinth <= SLAB_T + EPS:
        return
    rooms = _valid_rooms(ground.get("rooms", []))
    xs, ys = _grid(rooms)
    part = _new_part(parts, "nen-nha", "Cốt nền", "trim", 1, material="stone")
    for x0, y0, x1, y1 in _cover_rects(_cells(rooms, xs, ys), xs, ys):
        box(part, PLINTH_RGB, x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, 0.0, plinth - SLAB_T)


def _entry_steps(parts, lazy, axis, pos, a, b, out, plinth, garage, index, fi=1):
    """Bac tam cap truoc cua ngoai tang 1 (cua gara: doc len xe)."""
    pid = f"t{fi}-tam-cap-{index}"
    if pid not in lazy:
        lazy[pid] = _new_part(parts, pid, f"T{fi} · " + ("Dốc gara" if garage else "Bậc tam cấp"), "stairs", fi, material="stone")
    part = lazy[pid]
    start = WALL_T / 2
    if garage:
        run = max(1.2, plinth * 4)
        if axis == "h":
            p = lambda along, off, z: (along, pos + out * off, z)
        else:
            p = lambda along, off, z: (pos + out * off, along, z)
        top = [p(a, start, plinth), p(b, start, plinth), p(b, start + run, 0.0), p(a, start + run, 0.0)]
        center = _w(*p((a + b) / 2, start + run / 2, -1.0))
        part["faces"].append((PLINTH_RGB, _outward([_w(*v) for v in top], center)))
        for side in (a, b):
            tri = [p(side, start, 0.0), p(side, start, plinth), p(side, start + run, 0.0)]
            part["faces"].append((PLINTH_RGB, _outward([_w(*v) for v in tri], _w(*p((a + b) / 2, start + run / 3, plinth / 3)))))
        return
    n = max(1, round(plinth / 0.15))
    for k in range(n):
        top = plinth * (1 - k / n)
        lo, hi = sorted((out * start, out * (start + 0.3 * (k + 1))))
        _slab(part, PLINTH_RGB, axis, pos, a - 0.3, b + 0.3, lo, hi, 0.0, top)


def _porch_canopies(parts, floor, upper, fi, z):
    """Mai hien phang (san be tong co dien) cho phan hien tang `fi` khong co tang tren che."""
    porches = [r for r in _valid_rooms(floor.get("rooms", [])) if r.get("type") == "porch"]
    if not porches:
        return
    xs, ys = _grid(porches, upper)
    bare = _cells(porches, xs, ys) - _cells(upper, xs, ys)
    if not bare:
        return
    part = _new_part(parts, f"t{fi}-mai-hien", f"T{fi} · Mái hiên", "trim", fi)
    for x0, y0, x1, y1 in _cover_rects(bare, xs, ys):
        box(part, CATEGORY_COLORS["trim"], x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, z - SLAB_T, z + 0.05)


def _terraces(parts, floors, levels, style=None):
    """Phan tang duoi khong co tang tren phu len: lam san thuong (san + lan can) o cao do tang tren.
    Tang ham lo ra ngoai tang tren thi nam duoi dat, khong lam san thuong."""
    for fi in range(1, len(floors)):
        if floors[fi - 1].get("kind") == "basement":
            continue
        lower = [r for r in _valid_rooms(floors[fi - 1].get("rooms", [])) if r.get("type") not in ("void", "balcony", "porch")]
        upper = _valid_rooms(floors[fi].get("rooms", []))
        _porch_canopies(parts, floors[fi - 1], upper, fi, levels[fi][0])
        xs, ys = _grid(lower, upper)
        covered = _cells(upper, xs, ys)
        open_cells = _cells(lower, xs, ys) - covered
        if not open_cells:
            continue
        z = levels[fi][0]
        for k, (x0, y0, x1, y1) in enumerate(_cover_rects(open_cells, xs, ys)):
            part = _new_part(parts, f"t{fi + 1}-san-thuong-{k}", f"T{fi + 1} · Sân thượng · Sàn", "floor", fi + 1, material="paving")
            box(part, CATEGORY_COLORS["floor"], x0, x1, y0, y1, z - SLAB_T, z)
        rail = _new_part(parts, f"t{fi + 1}-san-thuong-lan-can", f"T{fi + 1} · Sân thượng · Lan can", "railing", fi + 1)
        glass = _new_part(parts, f"t{fi + 1}-san-thuong-lan-can-kinh", f"T{fi + 1} · Sân thượng · Lan can kính", "glass", fi + 1)
        for axis, pos, a, b in _boundary(open_cells, xs, ys, skip=covered):
            _railing(rail, glass, (style or FACADE_STYLES["basic"])["railing"], axis, pos, a, b, z)


def _open_link_holes(holes, rooms, lower_floor, height, has_upper, rails=None, floor=None):
    """Canh thong giua hanh lang/cau thang va phong chung: bo tuong. O tang tren, lo cau thang (khong co san)
    giu lan can RAILING_H, chi mo khoang dau tren cua vet thang tu duoi len va khoang chan cua vet thang tiep theo."""
    def railing(key, s0, e0):  # rails != None: mo het tuong, ve lan can that; khong thi de tuong thap (dung de tinh loi di)
        if rails is None:
            holes.setdefault(key, []).append((s0, e0, RAILING_H, height))
        else:
            holes.setdefault(key, []).append((s0, e0, 0.0, height))
            rails.append((key[0], key[1], s0, e0))

    for _v, _r, (axis, pos, lo, hi) in _void_links(_valid_rooms(rooms), floor):
        if lower_floor is None:
            holes.setdefault((axis, round(pos, 4)), []).append((lo, hi, 0.0, height))
        else:
            railing((axis, round(pos, 4)), lo, hi)
    lower = [r for r in _valid_rooms((lower_floor or {}).get("rooms", [])) if r.get("type") == "stairs"]
    for a, b, seg in _open_links(_valid_rooms(rooms), floor):
        axis, pos, lo, hi = seg
        key = (axis, round(pos, 4))
        void = next((r for r in (a, b) if r.get("type") == "stairs"), None) if lower_floor is not None else None
        if void is None:
            holes.setdefault(key, []).append((lo, hi, 0.0, height))
            continue
        below = next((r for r in lower if all(abs(float(r[k]) - float(void[k])) < 0.05 for k in "xywd")), None)
        ends = ([(void, "entry")] if has_upper else []) + ([(below, "arrival")] if below else [])
        openings = []
        for room, which in ends:
            for t_axis, t_pos, t_a, t_b in _stair_plan(room)[which]:
                if t_axis == axis and abs(t_pos - pos) < EPS:
                    openings.append((max(lo, t_a), min(hi, t_b)))
        cursor = lo
        for s, e in _merge([o for o in openings if o[1] - o[0] > EPS]):
            if s > cursor + EPS:
                railing(key, cursor, s)
            holes.setdefault(key, []).append((s, e, 0.0, height))
            cursor = max(cursor, e)
        if hi > cursor + EPS:
            railing(key, cursor, hi)


def _flatten_holes(holes):
    """Gop cac lo chong nhau tren mot duong tuong thanh cac doan khong chong.
    shortcut: doan chong nhau lay z0 thap nhat va z1 cao nhat, du cho cua nam trong canh da mo."""
    holes = sorted(holes)
    cuts = sorted({v for h in holes for v in h[:2]})
    out = []
    for s, e in zip(cuts, cuts[1:]):
        covering = [h for h in holes if h[0] <= s + EPS and h[1] >= e - EPS]
        if not covering:
            continue
        z0, z1 = min(h[2] for h in covering), max(h[3] for h in covering)
        if out and abs(out[-1][1] - s) < EPS and out[-1][2:] == (z0, z1):
            out[-1] = (out[-1][0], e, z0, z1)
        else:
            out.append((s, e, z0, z1))
    return out


def _stairs(part, r, base, height, rail=None):
    """Bac thang tung ve, chieu nghi, dam thang va tay vin hai ben moi ve."""
    plan = _stair_plan(r)
    m, rect = plan["map"], plan["rect"]
    rgb = CATEGORY_COLORS["stairs"]
    for u0, u1, v0, v1, way, z0, z1 in plan["flights"]:
        rise_total = height * (z1 - z0)
        steps = max(1, math.ceil(rise_total / 0.17))
        span = (u1 - u0) if way[0] == "u" else (v1 - v0)
        for k in range(steps):
            a, b = span * k / steps, span * (k + 1) / steps
            if way == "u+":
                sub = (u0 + a, u0 + b, v0, v1)
            elif way == "u-":
                sub = (u1 - b, u1 - a, v0, v1)
            else:
                sub = (u0, u1, v0 + a, v0 + b)
            top = base + height * z0 + rise_total * (k + 1) / steps
            xa, xb, ya, yb = rect(*sub)
            box(part, rgb, xa, xb, ya, yb, top - rise_total / steps, top)
        if rail is None:
            continue
        if way[0] == "u":
            start, end = (u0, u1) if way == "u+" else (u1, u0)
            lines = [(lambda t, v=v: m(t, v)) for v in (v0 + 0.05, v1 - 0.05)]
        else:
            start, end = v0, v1
            lines = [(lambda t, u=u: m(u, t)) for u in (u0 + 0.05, u1 - 0.05)]
        za, zb = base + height * z0, base + height * z1
        for line in lines:
            (xa, ya), (xb, yb) = line(start), line(end)
            _bar(rail, CATEGORY_COLORS["railing"], (xa, ya, za - 0.25), (xb, yb, zb - 0.25), 0.05, 0.3)
            _bar(rail, CATEGORY_COLORS["railing"], (xa, ya, za + 0.9), (xb, yb, zb + 0.9), 0.05, 0.05)
    for u0, u1, v0, v1, z in plan["landings"]:
        xa, xb, ya, yb = rect(u0, u1, v0, v1)
        box(part, rgb, xa, xb, ya, yb, base + height * z - 0.15, base + height * z)


def _roof(parts, layout, z, tag):
    """Mai phu dung hinh tang tren cung (chu L, chu U chia thanh nhieu khoi mai); bo trong o gieng troi."""
    rooms = [r for r in _valid_rooms(layout["floors"][-1]["rooms"]) if r.get("type") != "void"]
    roof = layout.get("roof", {})
    kind = roof.get("type", "flat")
    over = float(roof.get("overhang", 0.4 if kind != "flat" else 0.0))
    spec = [b for b in roof.get("blocks") or [] if all(isinstance(b.get(k), (int, float)) for k in ("x", "y", "w", "d"))]
    xs, ys = _grid(rooms, spec)
    cells = _cells(rooms, xs, ys)
    ceiling = _new_part(parts, "tran", "Trần tầng trên cùng", "floor", tag, order=1000)
    roofed = cells & _cells(spec, xs, ys) if spec else cells  # san thuong ho (khong nam trong khoi mai) thi khong co tran
    for x0, y0, x1, y1 in _cover_rects(roofed, xs, ys):
        box(ceiling, CATEGORY_COLORS["floor"], x0, x1, y0, y1, z, z + SLAB_T)
    top = _new_part(parts, "mai", "Mái", "roof", tag, order=1000)
    edge = _new_part(parts, "mai-dien", "Mái · Diềm, máng xối", "trim", tag, order=1000)
    z += SLAB_T
    if spec:  # tron mai: moi khoi tu chon kieu
        dormer_glass = _new_part(parts, "mai-cua-so", "Mái · Kính cửa sổ mái", "glass", tag, order=1000)
        parapet = _new_part(parts, "mai-tuong", "Mái · Tường chắn mái", "wall", tag, order=1000)
        block_cells = [_cells([b], xs, ys) & cells for b in spec]
        for k, b in enumerate(spec):
            bk = b.get("type", kind)
            others = set().union(*(c for j, c in enumerate(block_cells) if j != k)) if len(spec) > 1 else set()
            if bk == "flat":
                for axis, pos, a, c in _boundary(block_cells[k], xs, ys, skip=others):
                    _wall_piece(parapet, CATEGORY_COLORS["wall"], axis, pos, a, c, z, z + 0.8, t=0.1)
                    _wall_piece(edge, CATEGORY_COLORS["trim"], axis, pos, a - 0.04, c + 0.04, z + 0.8, z + 0.86, t=0.18)
                continue
            bo = float(b.get("overhang", over))
            pitch = math.radians(float(b.get("pitch_deg", roof.get("pitch_deg", ROOF_PITCH[bk]) if bk == kind else ROOF_PITCH[bk])))
            x0, y0, x1, y1 = b["x"] - bo, b["y"] - bo, b["x"] + b["w"] + bo, b["y"] + b["d"] + bo
            slope = b.get("slope_to", roof.get("slope_to", "back"))
            own = (x0, y0, x1, y1)
            _roof_block(top, bk, x0, x1, y0, y1, z, pitch, slope, own)
            _roof_edges(edge, top, bk, x0, x1, y0, y1, z, pitch, slope, own)
            if bk == "mansard":
                _dormers(edge, dormer_glass, x0, x1, y0, y1, z)
            if bk == "shed":
                _shed_walls(parapet, block_cells[k], xs, ys, others, z, pitch, slope, own)
        return
    if kind == "flat":
        parapet = _new_part(parts, "mai-tuong", "Mái · Tường chắn mái bằng", "wall", tag, order=1000)
        for axis, pos, a, b in _boundary(cells, xs, ys):
            _wall_piece(parapet, CATEGORY_COLORS["wall"], axis, pos, a, b, z, z + 0.8, t=0.1)
            _wall_piece(edge, CATEGORY_COLORS["trim"], axis, pos, a - 0.04, b + 0.04, z + 0.8, z + 0.86, t=0.18)
        return
    pitch = math.radians(float(roof.get("pitch_deg", ROOF_PITCH[kind])))
    blocks = [(x0 - over, y0 - over, x1 + over, y1 + over) for x0, y0, x1, y1 in _roof_rects(cells, xs, ys)]
    bounds = (min(b[0] for b in blocks), min(b[1] for b in blocks), max(b[2] for b in blocks), max(b[3] for b in blocks))
    dormer_glass = _new_part(parts, "mai-cua-so", "Mái · Kính cửa sổ mái", "glass", tag, order=1000) if kind == "mansard" else None
    for x0, y0, x1, y1 in blocks:
        _roof_block(top, kind, x0, x1, y0, y1, z, pitch, roof.get("slope_to", "back"), bounds)
        _roof_edges(edge, top, kind, x0, x1, y0, y1, z, pitch, roof.get("slope_to", "back"), bounds)
        if dormer_glass is not None:
            _dormers(edge, dormer_glass, x0, x1, y0, y1, z)
    if kind == "shed":  # tuong chan mai phia cao: chi doc theo mep ngoai cua nha, khong o cho cac khoi mai giao nhau
        h = _shed_height(z, pitch, roof.get("slope_to", "back"), bounds)
        center = _w((bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2, z)
        parapet = _new_part(parts, "mai-tuong", "Mái · Tường chắn mái lệch", "wall", tag, order=1000)
        _shed_walls(parapet, cells, xs, ys, set(), z, pitch, roof.get("slope_to", "back"), bounds)


def _shed_walls(parapet, cells, xs, ys, skip, z, pitch, slope_to, bounds):
    """Tuong chan phia cao cua mai lech, chay doc mep ngoai cua tap o (khong o cho giap khoi mai khac)."""
    h = _shed_height(z, pitch, slope_to, bounds)
    center = _w((bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2, z)
    for axis, pos, a, b in _boundary(cells, xs, ys, skip=skip):
        ends = [(a, pos), (b, pos)] if axis == "h" else [(pos, a), (pos, b)]
        poly = [_w(*ends[0], z), _w(*ends[1], z), _w(*ends[1], h(*ends[1])), _w(*ends[0], h(*ends[0]))]
        poly = [v for i, v in enumerate(poly) if v != poly[i - 1]]
        if len(poly) >= 3:
            parapet["faces"].append((CATEGORY_COLORS["wall"], _outward(poly, center)))


def _mansard_split(x0, x1, y0, y1, z):
    """Mai mansard: phan duoi doc 70 do cao hm, lui vao `inset`; tra ve (hm, inset)."""
    steep = math.radians(70)
    hm = max(0.6, min(1.4, (min(x1 - x0, y1 - y0) / 2 - 0.6) * math.tan(steep)))
    return hm, hm / math.tan(steep)


def _tiered_split(x0, x1, y0, y1, pitch):
    """Mai chong 2 cap: cap duoi cao t (dung nua doan doc), khe thong gio 0.45m; tra ve (t, inset, gap)."""
    span = min(x1 - x0, y1 - y0)
    t = span / 4 * math.tan(pitch)
    return t, t / math.tan(pitch), 0.45


def _top_hip(kind, x0, x1, y0, y1, z, pitch):
    """Khoi mai hip phia tren cung (de ve bo noc): (x0, x1, y0, y1, z, pitch, kieu)."""
    if kind == "mansard":
        hm, inset = _mansard_split(x0, x1, y0, y1, z)
        return x0 + inset, x1 - inset, y0 + inset, y1 - inset, z + hm, pitch, "hip"
    if kind == "tiered":
        t, inset, gap = _tiered_split(x0, x1, y0, y1, pitch)
        return x0 + inset - 0.5, x1 - inset + 0.5, y0 + inset - 0.5, y1 - inset + 0.5, z + t + gap, pitch, "hip"
    return x0, x1, y0, y1, z, pitch, kind


def _frustum(top, rgb, x0, x1, y0, y1, z, ix0, ix1, iy0, iy1, zt):
    """Bon mat doc tu hinh chu nhat day (z) len hinh chu nhat thu nho (zt)."""
    center = _w((x0 + x1) / 2, (y0 + y1) / 2, z)
    for quad in ([(x0, y0, z), (x1, y0, z), (ix1, iy0, zt), (ix0, iy0, zt)], [(x1, y0, z), (x1, y1, z), (ix1, iy1, zt), (ix1, iy0, zt)],
                 [(x1, y1, z), (x0, y1, z), (ix0, iy1, zt), (ix1, iy1, zt)], [(x0, y1, z), (x0, y0, z), (ix0, iy0, zt), (ix0, iy1, zt)]):
        top["faces"].append((rgb, _outward([_w(*v) for v in quad], center)))


def _dormers(edge, glass, x0, x1, y0, y1, z):
    """Cua so mai tren phan doc cua mai mansard, doc theo hai canh dai."""
    hm, inset = _mansard_split(x0, x1, y0, y1, z)
    along_x = (x1 - x0) >= (y1 - y0)
    length = (x1 - x0) if along_x else (y1 - y0)
    count = max(1, int((length - 1.0) / 2.6))
    for k in range(count):
        c = (x0 if along_x else y0) + length * (k + 0.5) / count
        for side, sign in (((y0 if along_x else x0), 1), ((y1 if along_x else x1), -1)):
            face = side + sign * inset * 0.3
            back = side + sign * (inset + 0.4)
            lo, hi = sorted((face, back))
            zb, zt = z + 0.25, z + hm + 0.15
            if along_x:
                box(edge, CATEGORY_COLORS["trim"], c - 0.5, c + 0.5, lo, hi, zb, zt)
                box(glass, CATEGORY_COLORS["glass"], c - 0.35, c + 0.35, face - 0.01 * sign - 0.005, face - 0.01 * sign + 0.005, zb + 0.15, zt - 0.15)
            else:
                box(edge, CATEGORY_COLORS["trim"], lo, hi, c - 0.5, c + 0.5, zb, zt)
                box(glass, CATEGORY_COLORS["glass"], face - 0.01 * sign - 0.005, face - 0.01 * sign + 0.005, c - 0.35, c + 0.35, zb + 0.15, zt - 0.15)


def _shed_height(z, pitch, slope_to, bounds):
    """Cao do mat mai lech tai (x, y): mot mat phang chung cho ca mai, thap nhat o phia `slope_to`."""
    t = math.tan(pitch)
    bx0, by0, bx1, by1 = bounds
    lift = z + 0.05  # tranh trung mat voi tran o mep thap
    return {"back": lambda x, y: lift + (by1 - y) * t, "front": lambda x, y: lift + (y - by0) * t,
            "right": lambda x, y: lift + (bx1 - x) * t, "left": lambda x, y: lift + (x - bx0) * t}[slope_to]


def _shed_block(top, x0, x1, y0, y1, z, pitch, slope_to, bounds):
    """Mot khoi cua mai lech (chi mat mai; tuong chan phia cao ve rieng theo mep nha)."""
    h = _shed_height(z, pitch, slope_to, bounds)
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    poly = [_w(x, y, h(x, y)) for x, y in corners]
    top["faces"].append((CATEGORY_COLORS["roof"], _outward(poly, _w((x0 + x1) / 2, (y0 + y1) / 2, z - 10))))


def _roof_edges(edge, top, kind, x0, x1, y0, y1, z, pitch, slope_to, bounds):
    """Diem mai, may hien (mat duoi phan mai chia ra), may xoi o mep thap, bo noc."""
    trim, gutter = CATEGORY_COLORS["trim"], GUTTER_RGB
    if kind == "shed":  # chi mep thap that cua ca mai (trung bien ngoai) moi co diem va mang xoi
        bx0, by0, bx1, by1 = bounds
        low = {"back": ("h", y1, x0, x1, 1, abs(y1 - by1)), "front": ("h", y0, x0, x1, -1, abs(y0 - by0)),
               "right": ("v", x1, y0, y1, 1, abs(x1 - bx1)), "left": ("v", x0, y0, y1, -1, abs(x0 - bx0))}[slope_to]
        lows = [low[:5]] if low[5] < EPS else []
    else:
        box(edge, trim, x0, x1, y0, y1, z - 0.04, z - 0.01)  # may hien
        lows = [("h", y0, x0, x1, -1), ("h", y1, x0, x1, 1), ("v", x0, y0, y1, -1), ("v", x1, y0, y1, 1)]
        if kind == "gable":  # dau hoi: chi hai mep dai co may xoi
            lows = [l for l in lows if (l[0] == "v") == ((y1 - y0) >= (x1 - x0))]
        x0, x1, y0, y1, zr, pitch, top_kind = _top_hip(kind, x0, x1, y0, y1, z, pitch)
        along_y = (y1 - y0) >= (x1 - x0)
        span = (x1 - x0) if along_y else (y1 - y0)
        ridge_z = zr + span / 2 * math.tan(pitch)
        inset = span / 2 if top_kind == "hip" else 0.0
        if along_y:
            r0, r1 = y0 + inset, y1 - inset
            if r1 - r0 > EPS:
                xm = (x0 + x1) / 2
                box(top, CATEGORY_COLORS["roof"], xm - 0.09, xm + 0.09, r0, r1, ridge_z - 0.03, ridge_z + 0.09)
        else:
            r0, r1 = x0 + inset, x1 - inset
            if r1 - r0 > EPS:
                ym = (y0 + y1) / 2
                box(top, CATEGORY_COLORS["roof"], r0, r1, ym - 0.09, ym + 0.09, ridge_z - 0.03, ridge_z + 0.09)
    for axis, pos, a, b, sign in lows:  # lows giu toa do khoi goc (mep mai thap nhat)
        zz = z + 0.05 if kind == "shed" else z
        lo, hi = sorted((0.0, sign * 0.04))
        _slab(edge, trim, axis, pos, a, b, lo, hi, zz - 0.2, zz + 0.03)  # diem mai
        lo, hi = sorted((sign * 0.04, sign * 0.15))
        _slab(edge, gutter, axis, pos, a, b, lo, hi, zz - 0.14, zz - 0.04)  # mang xoi


def _roof_block(top, kind, x0, x1, y0, y1, z, pitch, slope_to, bounds):
    if kind == "shed":
        _shed_block(top, x0, x1, y0, y1, z, pitch, slope_to, bounds)
        return
    if kind == "mansard":
        hm, inset = _mansard_split(x0, x1, y0, y1, z)
        _frustum(top, CATEGORY_COLORS["roof"], x0, x1, y0, y1, z, x0 + inset, x1 - inset, y0 + inset, y1 - inset, z + hm)
        _roof_block(top, "hip", x0 + inset, x1 - inset, y0 + inset, y1 - inset, z + hm, pitch, slope_to, bounds)
        return
    if kind == "tiered":
        t, inset, gap = _tiered_split(x0, x1, y0, y1, pitch)
        ix0, ix1, iy0, iy1 = x0 + inset, x1 - inset, y0 + inset, y1 - inset
        _frustum(top, CATEGORY_COLORS["roof"], x0, x1, y0, y1, z, ix0, ix1, iy0, iy1, z + t)
        center = _w((x0 + x1) / 2, (y0 + y1) / 2, z)
        for quad in ([(ix0, iy0), (ix1, iy0)], [(ix1, iy0), (ix1, iy1)], [(ix1, iy1), (ix0, iy1)], [(ix0, iy1), (ix0, iy0)]):
            (ax, ay), (bx, by) = quad  # vach thong gio giua hai cap mai
            top["faces"].append((CATEGORY_COLORS["wall"], _outward([_w(ax, ay, z + t), _w(bx, by, z + t), _w(bx, by, z + t + gap), _w(ax, ay, z + t + gap)], center)))
        _roof_block(top, "hip", ix0 - 0.5, ix1 + 0.5, iy0 - 0.5, iy1 + 0.5, z + t + gap, pitch, slope_to, bounds)
        return
    along_y = (y1 - y0) >= (x1 - x0)  # noc chay theo canh dai
    span = (x1 - x0) if along_y else (y1 - y0)
    ridge_z = z + span / 2 * math.tan(pitch)
    inset = span / 2 if kind == "hip" else 0.0
    if along_y:
        xm = (x0 + x1) / 2
        r0, r1 = min(y0 + inset, (y0 + y1) / 2), max(y1 - inset, (y0 + y1) / 2)
        planes = [
            [(x0, y0, z), (x0, y1, z), (xm, r1, ridge_z), (xm, r0, ridge_z)],
            [(x1, y0, z), (x1, y1, z), (xm, r1, ridge_z), (xm, r0, ridge_z)],
            [(x0, y0, z), (x1, y0, z), (xm, r0, ridge_z)],
            [(x0, y1, z), (x1, y1, z), (xm, r1, ridge_z)],
        ]
    else:
        ym = (y0 + y1) / 2
        r0, r1 = min(x0 + inset, (x0 + x1) / 2), max(x1 - inset, (x0 + x1) / 2)
        planes = [
            [(x0, y0, z), (x1, y0, z), (r1, ym, ridge_z), (r0, ym, ridge_z)],
            [(x0, y1, z), (x1, y1, z), (r1, ym, ridge_z), (r0, ym, ridge_z)],
            [(x0, y0, z), (x0, y1, z), (r0, ym, ridge_z)],
            [(x1, y0, z), (x1, y1, z), (r1, ym, ridge_z)],
        ]
    center = _w((x0 + x1) / 2, (y0 + y1) / 2, z)
    for p in planes:
        poly = [_w(*v) for v in p]
        poly = [v for i, v in enumerate(poly) if v != poly[i - 1]]  # bo dinh trung khi noc thoai hoa
        if len(poly) >= 3:
            rgb = CATEGORY_COLORS["wall"] if kind == "gable" and len(poly) == 3 else CATEGORY_COLORS["roof"]
            top["faces"].append((rgb, _outward(poly, center)))


def _render_faces(parts, colors):
    """Danh sach (rgb, tang, poly) da ap mau ghi de, dung cho iso.svg."""
    out = []
    for part in parts:
        if part["id"].endswith("-tay-vin"):  # chi tiet ben trong nha: thuat toan hoa si se ve de len tuong ngoai
            continue
        override = resolve_color(part, colors)
        out.extend((override or rgb, part["floor"], poly) for rgb, poly in part["faces"])
    return out


# ---------------------------------------------------------------- xuat file

def write_glb(parts, path, colors=None):
    gltf = {"asset": {"version": "2.0", "generator": "house_builder.py"}, "scene": 0,
            "scenes": [{"nodes": [0]}], "nodes": [{"name": "Nhà", "children": []}],
            "meshes": [], "materials": [], "accessors": [], "bufferViews": []}
    blob = bytearray()
    materials = {}
    group_nodes = {}
    top_floor = max(p["floor"] for p in parts)

    def view(data, target):
        while len(blob) % 4:
            blob.append(0)
        gltf["bufferViews"].append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(data), "target": target})
        blob.extend(data)
        return len(gltf["bufferViews"]) - 1

    def material(rgb):
        key = tuple(round(c, 4) for c in rgb)
        if key not in materials:
            materials[key] = len(gltf["materials"])
            gltf["materials"].append({"name": "#%02x%02x%02x" % tuple(int(c * 255) for c in key), "doubleSided": True,
                                      "pbrMetallicRoughness": {"baseColorFactor": [*(round(_linear(c), 5) for c in key), 1.0],
                                                               "metallicFactor": 0.0, "roughnessFactor": 0.9}})
        return materials[key]

    def group(floor):
        if floor not in group_nodes:
            gltf["nodes"].append({"name": "Mái" if floor == top_floor else f"Tầng {floor}", "children": []})
            group_nodes[floor] = len(gltf["nodes"]) - 1
            gltf["nodes"][0]["children"].append(group_nodes[floor])
        return group_nodes[floor]

    for part in sorted(parts, key=lambda p: (p["floor"], p["order"])):
        if not part["faces"]:
            continue
        override = resolve_color(part, colors)
        by_color = {}
        for rgb, poly in part["faces"]:
            by_color.setdefault(tuple(round(c, 4) for c in (override or rgb)), []).append(poly)
        primitives = []
        for rgb, polys in by_color.items():
            pos, nor, idx = [], [], []
            for poly in polys:
                n = _normal(poly)
                start = len(pos)
                pos.extend(poly)
                nor.extend([n] * len(poly))
                for i in range(1, len(poly) - 1):
                    idx.extend((start, start + i, start + i + 1))
            pv = view(struct.pack(f"<{len(pos) * 3}f", *[c for p in pos for c in p]), 34962)
            nv = view(struct.pack(f"<{len(nor) * 3}f", *[c for p in nor for c in p]), 34962)
            iv = view(struct.pack(f"<{len(idx)}I", *idx), 34963)
            acc = gltf["accessors"]
            acc.append({"bufferView": pv, "componentType": 5126, "count": len(pos), "type": "VEC3",
                        "min": [min(p[i] for p in pos) for i in range(3)], "max": [max(p[i] for p in pos) for i in range(3)]})
            acc.append({"bufferView": nv, "componentType": 5126, "count": len(nor), "type": "VEC3"})
            acc.append({"bufferView": iv, "componentType": 5125, "count": len(idx), "type": "SCALAR"})
            primitives.append({"attributes": {"POSITION": len(acc) - 3, "NORMAL": len(acc) - 2},
                               "indices": len(acc) - 1, "material": material(rgb)})
        gltf["meshes"].append({"name": part["id"], "primitives": primitives})
        gltf["nodes"].append({"name": part["name"], "mesh": len(gltf["meshes"]) - 1,
                              "extras": {k: part[k] for k in ("category", "floor", "room", "order")} | {"partId": part["id"], "name": part["name"]}
                              | ({"material": part["material"]} if part.get("material") else {})})
        node_index = len(gltf["nodes"]) - 1  # lay truoc: group() co the them node tang moi
        gltf["nodes"][group(part["floor"])]["children"].append(node_index)
    while len(blob) % 4:
        blob.append(0)
    gltf["buffers"] = [{"byteLength": len(blob)}]
    js = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    total = 12 + 8 + len(js) + 8 + len(blob)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(blob), 0x004E4942) + bytes(blob))


def _subdivide(faces, cell=1.2):
    """Chia mat tu giac lon thanh o nho de thuat toan hoa si sap thu tu ve dung hon (chi dung khi ve).
    faces la cac tuple (..., poly); phan dau duoc giu nguyen."""
    out = []
    for face in faces:
        *meta, poly = face
        if len(poly) != 4:
            out.append(face)
            continue
        a, b, c, d = poly
        nu = max(1, math.ceil(math.dist(a, b) / cell))
        nv = max(1, math.ceil(math.dist(a, d) / cell))

        def at(u, v):
            return tuple(round((1 - u) * (1 - v) * a[i] + u * (1 - v) * b[i] + u * v * c[i] + (1 - u) * v * d[i], 4) for i in range(3))

        for i in range(nu):
            for j in range(nv):
                u0, u1, v0, v1 = i / nu, (i + 1) / nu, j / nv, (j + 1) / nv
                out.append((*meta, [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]))
    return out


def _project(p, yaw, pitch):
    x, y, z = p
    x1 = x * math.cos(yaw) + z * math.sin(yaw)
    z1 = -x * math.sin(yaw) + z * math.cos(yaw)
    y2 = y * math.cos(pitch) - z1 * math.sin(pitch)
    z2 = y * math.sin(pitch) + z1 * math.cos(pitch)
    return x1, -y2, z2


def _shade(rgb, n):
    light = (0.42, 0.78, 0.46)
    k = 0.45 + 0.55 * max(0.0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2])
    return "#%02x%02x%02x" % tuple(int(min(1.0, c * k) * 255) for c in rgb)


def write_iso_svg(faces, path, yaw=math.radians(-35), pitch=math.radians(28)):
    drawn = []
    for rgb, _, poly in _subdivide(faces):
        proj = [_project(p, yaw, pitch) for p in poly]
        if _normal([(px, -py, pz) for px, py, pz in proj])[2] <= 0:  # mat quay lung voi camera
            continue
        depth = sum(p[2] for p in proj) / len(proj)
        drawn.append((depth, rgb, poly, proj))
    drawn.sort(key=lambda d: d[0])
    xs = [p[0] for d in drawn for p in d[3]]
    ys = [p[1] for d in drawn for p in d[3]]
    scale, pad = 22.0, 20.0
    min_x, min_y = min(xs), min(ys)  # tinh mot lan: tinh trong vong lap la O(n^2)
    width = (max(xs) - min_x) * scale + 2 * pad
    height = (max(ys) - min_y) * scale + 2 * pad
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width:.0f}" height="{height:.0f}" viewBox="0 0 {width:.0f} {height:.0f}">',
           f'<rect width="100%" height="100%" fill="#f7f7f4"/>']
    for _, rgb, poly, proj in drawn:
        pts = " ".join(f"{(px - min_x) * scale + pad:.1f},{(py - min_y) * scale + pad:.1f}" for px, py, _ in proj)
        shaded = _shade(rgb, _normal(poly))
        out.append(f'<polygon points="{pts}" fill="{shaded}" stroke="{shaded}" stroke-width="0.6"/>')
    out.append("</svg>")
    Path(path).write_text("\n".join(out), encoding="utf-8")


def _esc(text):
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _text_width(text, size):
    return len(str(text)) * size * 0.56  # uoc luong chu sans-serif co dau


def _fit_label(text, w, d, sizes=(11, 10, 9, 8)):
    """Co chu va xuong dong de nhan nam gon trong o w x d (px). None neu khong vua."""
    words = str(text).split()
    splits = [[str(text)]] + [[" ".join(words[:k]), " ".join(words[k:])] for k in range(1, len(words))]
    for size in sizes:
        for lines in splits[:1] + sorted(splits[1:], key=lambda ls: max(len(x) for x in ls)):  # uu tien mot dong
            if max(_text_width(x, size) for x in lines) <= w - 6 and len(lines) * (size + 2) <= d - 4:
                return size, lines
    return None


def _label_svg(text, cx, cy, w, d, legend, extra=None, fill="#222"):
    """Nhan giua o; neu o qua nho thi doc theo chieu dai, hoac ghi so va dua vao chu giai."""
    fit = _fit_label(text, w, d)
    if fit:
        size, lines = fit
        rows = lines + ([extra] if extra and (len(lines) + 1) * (size + 2) <= d - 4 else [])
        top = cy - (len(rows) - 1) * (size + 2) / 2 + size * 0.35
        return [f'<text x="{cx:.1f}" y="{top + k * (size + 2):.1f}" font-size="{size if k < len(lines) else size - 2}" '
                f'fill="{fill if k < len(lines) else "#555"}" text-anchor="middle">{_esc(row)}</text>' for k, row in enumerate(rows)]
    fit = _fit_label(text, d, w)
    if fit and d > w:  # dai doc hep: xoay chu theo chieu dai
        size, lines = fit
        left = cx - (len(lines) - 1) * (size + 2) / 2 + size * 0.35
        return [f'<text x="{left + k * (size + 2):.1f}" y="{cy:.1f}" font-size="{size}" fill="{fill}" text-anchor="middle" '
                f'transform="rotate(-90 {left + k * (size + 2):.1f} {cy:.1f})">{_esc(line)}</text>' for k, line in enumerate(lines)]
    legend.append(f"{text}" + (f" ({extra})" if extra else ""))
    n = len(legend)
    return [f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="7" fill="#fff" stroke="#333"/>',
            f'<text x="{cx:.1f}" y="{cy + 3:.1f}" font-size="9" text-anchor="middle">{n}</text>']


def write_plan_svg(layout, path, scale=32):
    lot_w, lot_d = layout["lot"]["width"], layout["lot"]["depth"]
    pad, gap = 30, 40
    panel_w = lot_w * scale + gap
    floors = layout["floors"]
    body, legends = [], []
    ground = _valid_rooms(floors[0].get("rooms", [])) if floors else []
    for fi, floor in enumerate(floors):
        ox, oy = pad + fi * panel_w, pad + 20
        legend = []
        body.append(f'<text x="{ox}" y="{oy - 10}" font-size="14" font-weight="bold">{_floor_names(floors)[fi + 1]}</text>')
        body.append(f'<rect x="{ox}" y="{oy}" width="{lot_w * scale}" height="{lot_d * scale}" fill="none" stroke="#999" stroke-dasharray="4 3"/>')
        by_id = {r["id"]: r for r in floor["rooms"]}
        if fi == 0:
            body.extend(_site_svg(layout, ox, oy, scale, legend))
        else:  # tang tren: san vuon va tang 1 mo phia duoi de thay nha nam dung cho tren lo dat
            body.append('<g opacity="0.3">')
            body.extend(_site_svg(layout, ox, oy, scale, None))
            body.extend(f'<rect x="{ox + r["x"] * scale:.1f}" y="{oy + r["y"] * scale:.1f}" width="{r["w"] * scale:.1f}" height="{r["d"] * scale:.1f}" fill="#eee" stroke="#666" stroke-dasharray="3 2"/>' for r in ground)
            body.append('</g>')
        late = []  # nhan phong ve sau noi that de khong bi che
        for r in floor["rooms"]:
            x, y = ox + r["x"] * scale, oy + r["y"] * scale
            w, d = r["w"] * scale, r["d"] * scale
            body.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{d:.1f}" fill="{ROOM_COLORS.get(r.get("type"), "#f4f4f4")}" stroke="#333" stroke-width="2"/>')
            if r.get("type") == "stairs" and all(k in r for k in "xywd"):
                plan = _stair_plan(r)
                px = lambda pt: (ox + pt[0] * scale, oy + pt[1] * scale)
                route = []
                for u0, u1, v0, v1, way, _z0, _z1 in plan["flights"]:
                    count = 8
                    for k in range(1, count):
                        if way[0] == "u":
                            t = u0 + (u1 - u0) * k / count
                            (ax, ay), (bx, by) = px(plan["map"](t, v0)), px(plan["map"](t, v1))
                        else:
                            t = v0 + (v1 - v0) * k / count
                            (ax, ay), (bx, by) = px(plan["map"](u0, t)), px(plan["map"](u1, t))
                        body.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="#8d6e63" stroke-width="0.8"/>')
                    if way[0] == "u":
                        vm = (v0 + v1) / 2
                        ends = (u0, u1) if way == "u+" else (u1, u0)
                        route += [px(plan["map"](ends[0] + (0.15 if way == "u+" else -0.15), vm)), px(plan["map"](ends[1], vm))]
                    else:
                        um = (u0 + u1) / 2
                        route += [px(plan["map"](um, v0)), px(plan["map"](um, v1 - 0.15))]
                points = " ".join(f"{a:.1f},{b:.1f}" for a, b in route)
                body.append(f'<polyline points="{points}" fill="none" stroke="#5d4037" stroke-width="1.5" marker-end="url(#len)"/>')
            late.extend(_label_svg(r.get("name", r["id"]), x + w / 2, y + d / 2, w, d, legend, f'{r["w"] * r["d"]:.1f} m2'))
        for _a, _b, (axis, pos, a, b) in _open_links(_valid_rooms(floor["rooms"]), floor):  # thong nhau, khong co tuong
            if axis == "h":
                x1, y1, x2, y2 = ox + a * scale, oy + pos * scale, ox + b * scale, oy + pos * scale
            else:
                x1, y1, x2, y2 = ox + pos * scale, oy + a * scale, ox + pos * scale, oy + b * scale
            body.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="3 3"/>')
        for f in floor.get("furniture", []):  # nội thất nhìn từ trên, vạch đậm = mặt trước món đồ
            item = load_catalog().get(f.get("item"))
            if item is None or item.get("stack"):
                continue
            rot = int(f.get("rotation", 0)) % 360
            fx0, fy0, fx1, fy1 = _footprint(float(f["x"]), float(f["y"]), rot, item)
            px = [ox + fx0 * scale, oy + fy0 * scale, ox + fx1 * scale, oy + fy1 * scale]
            body.append(f'<rect x="{px[0]:.1f}" y="{px[1]:.1f}" width="{px[2] - px[0]:.1f}" height="{px[3] - px[1]:.1f}" '
                        f'fill="#ffffff" fill-opacity="0.75" stroke="#7a6a58" stroke-width="1"/>')
            front = {0: (px[0], px[1], px[2], px[1]), 90: (px[2], px[1], px[2], px[3]), 180: (px[0], px[3], px[2], px[3]),
                     270: (px[0], px[1], px[0], px[3])}.get(rot)
            if front:
                body.append(f'<line x1="{front[0]:.1f}" y1="{front[1]:.1f}" x2="{front[2]:.1f}" y2="{front[3]:.1f}" stroke="#7a6a58" stroke-width="2.5"/>')
        body.extend(late)
        for o in floor.get("openings", []):
            axis, pos, a, b = _opening_segment(by_id[o["room"]], o)
            color = "#2b7bb9" if o.get("kind") == "window" else "#d9480f"
            if axis == "h":
                x1, y1, x2, y2 = ox + a * scale, oy + pos * scale, ox + b * scale, oy + pos * scale
            else:
                x1, y1, x2, y2 = ox + pos * scale, oy + a * scale, ox + pos * scale, oy + b * scale
            body.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="5"/>')
        body.append(f'<text x="{ox}" y="{oy + lot_d * scale + 16}" font-size="10" fill="#666">Mat tien (y = 0) o phia tren</text>')
        legends.append((ox, oy + lot_d * scale + 34, legend))
    for ox, top, legend in legends:
        body.extend(f'<text x="{ox}" y="{top + k * 14}" font-size="10">{k + 1}. {_esc(item)}</text>' for k, item in enumerate(legend))
    height = lot_d * scale + 2 * pad + 20 + max((len(lg) * 14 + 10 for _, _, lg in legends), default=0)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{len(floors) * panel_w + pad:.0f}" height="{height:.0f}" font-family="sans-serif">',
           '<defs><marker id="len" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">'
           '<path d="M0,0 L8,4 L0,8 z" fill="#5d4037"/></marker></defs>',
           '<rect width="100%" height="100%" fill="#ffffff"/>', *body, "</svg>"]
    Path(path).write_text("\n".join(out), encoding="utf-8")


def product_slug(name):
    """Ten file khong dau tu ten san pham: "Nhà phố 2 tầng" -> "nha-pho-2-tang"."""
    text = unicodedata.normalize("NFD", str(name or "").replace("đ", "d").replace("Đ", "D"))
    text = "".join(c for c in text if not unicodedata.combining(c)).lower()
    slug = "-".join("".join(c if c.isascii() and c.isalnum() else " " for c in text).split())
    return slug or "mo-hinh-nha"


def build(layout, out_dir):
    """Dung toan bo dau ra (file 3D dat ten <ten-san-pham>.glb); tra ve danh sach bo phan."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    colors = layout.get("colors")
    parts = build_parts(layout)
    faces = _render_faces(parts, colors)
    write_glb(parts, out / f"{product_slug(layout.get('name'))}.glb", colors)
    write_plan_svg(layout, out / "plan.svg")
    write_iso_svg(faces, out / "iso.svg")
    return parts


# ---------------------------------------------------------------- mau va tu kiem tra

EXAMPLE = {
    "name": "Nhà phố 2 tầng 5x20m",
    "lot": {"width": 5, "depth": 20},
    "floor_height": 3.4,
    "roof": {"type": "hip", "pitch_deg": 35, "overhang": 0.4},
    "floors": [
        {"rooms": [
            {"id": "gara", "name": "Gara", "type": "garage", "x": 0, "y": 0, "w": 5, "d": 5.5},
            {"id": "khach", "name": "Phòng khách", "type": "living", "x": 0, "y": 5.5, "w": 3.8, "d": 5},
            {"id": "thang1", "name": "Cầu thang", "type": "stairs", "x": 3.8, "y": 5.5, "w": 1.2, "d": 5},
            {"id": "bep", "name": "Bếp + ăn", "type": "kitchen", "x": 0, "y": 10.5, "w": 5, "d": 5},
            {"id": "wc1", "name": "WC", "type": "wc", "x": 0, "y": 15.5, "w": 2, "d": 2},
            {"id": "sau", "name": "Sân sau", "type": "balcony", "x": 2, "y": 15.5, "w": 3, "d": 2}],
         "openings": [
            {"room": "gara", "side": "front", "offset": 0.8, "width": 3.2, "kind": "door", "head": 2.6},
            {"room": "gara", "side": "back", "offset": 1.2, "width": 1.0},
            {"room": "khach", "side": "left", "offset": 1.5, "width": 1.6, "kind": "window"},
            {"room": "khach", "side": "back", "offset": 1.4, "width": 1.0},
            {"room": "bep", "side": "back", "offset": 0.4, "width": 0.8},
            {"room": "bep", "side": "back", "offset": 2.8, "width": 1.0},
            {"room": "bep", "side": "left", "offset": 1.5, "width": 1.4, "kind": "window"}],
         "furniture": [
            {"id": "sofa", "item": "sofa-3", "room": "khach", "x": 0.5, "y": 8.0, "rotation": 90},
            {"id": "tham", "item": "tham", "room": "khach", "x": 2.0, "y": 8.0, "rotation": 90},
            {"id": "ban-tra", "item": "ban-tra", "room": "khach", "x": 2.0, "y": 8.0, "rotation": 90},
            {"id": "ke-tivi", "item": "ke-tivi", "room": "khach", "x": 3.5, "y": 8.0, "rotation": 270},
            {"id": "tivi", "item": "tivi", "room": "khach", "x": 3.55, "y": 8.0, "rotation": 270},
            {"id": "cay", "item": "cay-canh", "room": "khach", "x": 0.3, "y": 6.0, "rotation": 0},
            {"id": "tu-bep-1", "item": "tu-bep", "room": "bep", "x": 4.68, "y": 11.5, "rotation": 270},
            {"id": "tu-bep-tren", "item": "tu-bep-tren", "room": "bep", "x": 4.8, "y": 11.5, "rotation": 270},
            {"id": "bep-nau", "item": "bep-nau", "room": "bep", "x": 4.68, "y": 12.1, "rotation": 270},
            {"id": "bon-rua", "item": "bon-rua-bat", "room": "bep", "x": 4.68, "y": 12.7, "rotation": 270},
            {"id": "tu-lanh", "item": "tu-lanh", "room": "bep", "x": 4.71, "y": 13.65, "rotation": 270},
            {"id": "ban-an", "item": "ban-an", "room": "bep", "x": 2.2, "y": 13.0, "rotation": 0},
            {"id": "ghe-1", "item": "ghe", "room": "bep", "x": 2.2, "y": 12.2, "rotation": 180},
            {"id": "ghe-2", "item": "ghe", "room": "bep", "x": 2.2, "y": 13.85, "rotation": 0},
            {"id": "bon-cau", "item": "bon-cau", "room": "wc1", "x": 1.5, "y": 17.1, "rotation": 0},
            {"id": "lavabo", "item": "lavabo", "room": "wc1", "x": 0.4, "y": 17.2, "rotation": 0}]},
        {"rooms": [
            {"id": "ngu1", "name": "Ngủ 1", "type": "bedroom", "x": 0, "y": 0, "w": 5, "d": 4.5},
            {"id": "ngu2", "name": "Ngủ 2", "type": "bedroom", "x": 0, "y": 4.5, "w": 2.7, "d": 4},
            {"id": "hanh-lang2", "name": "Hành lang", "type": "hall", "x": 2.7, "y": 4.5, "w": 1.1, "d": 4},
            {"id": "thang2", "name": "Cầu thang", "type": "stairs", "x": 3.8, "y": 5.5, "w": 1.2, "d": 5},
            {"id": "sanh2", "name": "Sảnh", "type": "hall", "x": 0, "y": 8.5, "w": 3.8, "d": 2},
            {"id": "ngu3", "name": "Ngủ 3", "type": "bedroom", "x": 0, "y": 10.5, "w": 5, "d": 4},
            {"id": "wc2", "name": "WC", "type": "wc", "x": 0, "y": 14.5, "w": 2.5, "d": 2},
            {"id": "tu-kho", "name": "Tủ kho", "type": "storage", "x": 3.8, "y": 4.5, "w": 1.2, "d": 1},
            {"id": "logia", "name": "Lô gia", "type": "balcony", "x": 2.5, "y": 14.5, "w": 2.5, "d": 2}],
         "openings": [
            {"room": "ngu1", "side": "front", "offset": 1.0, "width": 3.0, "kind": "window"},
            {"room": "ngu1", "side": "back", "offset": 2.8, "width": 0.8},
            {"room": "ngu1", "side": "back", "offset": 3.95, "width": 0.8},
            {"room": "ngu2", "side": "back", "offset": 1.4, "width": 0.9},
            {"room": "ngu2", "side": "left", "offset": 1.0, "width": 1.4, "kind": "window"},
            {"room": "ngu3", "side": "front", "offset": 1.4, "width": 0.9},
            {"room": "ngu3", "side": "back", "offset": 0.8, "width": 0.8},
            {"room": "ngu3", "side": "back", "offset": 3.2, "width": 0.9},
            {"room": "ngu3", "side": "left", "offset": 1.2, "width": 1.4, "kind": "window"}],
         "furniture": [
            {"id": "giuong", "item": "giuong-doi", "room": "ngu1", "x": 0.96, "y": 2.0, "rotation": 90},
            {"id": "tu-dau-giuong", "item": "tu-dau-giuong", "room": "ngu1", "x": 0.3, "y": 0.8, "rotation": 90},
            {"id": "tu-quan-ao", "item": "tu-quan-ao", "room": "ngu1", "x": 4.68, "y": 2.0, "rotation": 270},
            {"id": "giuong", "item": "giuong-doi", "room": "ngu3", "x": 4.04, "y": 12.4, "rotation": 270},
            {"id": "bon-cau", "item": "bon-cau", "room": "wc2", "x": 2.0, "y": 16.1, "rotation": 0}]},
    ],
}


# ---------------------------------------------------------------- san vuon, hang rao, cong, cay

ZONE_TYPES = {  # loai khu -> (mau, z day, z mat); lawn/paving la nen, cac loai khac duoc nam tren nen
    "lawn": ((0.45, 0.66, 0.33), 0.0, 0.03),
    "paving": ((0.75, 0.72, 0.66), 0.0, 0.05),
    "path": ((0.68, 0.62, 0.52), 0.0, 0.06),
    "flowerbed": ((0.55, 0.38, 0.27), 0.0, 0.3),
    "pool": ((0.30, 0.60, 0.82), -0.3, 0.04),
}
BASE_ZONES = {"lawn", "paving"}
ZONE_NAMES = {"lawn": "Thảm cỏ", "paving": "Sân lát", "path": "Lối đi", "flowerbed": "Bồn hoa", "pool": "Hồ nước"}
ZONE_MATERIALS = {"lawn": "grass", "paving": "paving", "path": "gravel", "flowerbed": "soil", "pool": "water"}
TREE_COLORS = {"trunk": (0.42, 0.30, 0.20), "crown": (0.20, 0.38, 0.15), "shrub": (0.24, 0.42, 0.18)}
GATE_COLOR = (0.25, 0.25, 0.28)
FENCE_T = 0.08


def _side_line(side, lot_w, lot_d):
    """(truc, vi tri, dai) cua mot canh lo dat."""
    return {"front": ("h", 0.0, lot_w), "back": ("h", lot_d, lot_w), "left": ("v", 0.0, lot_d), "right": ("v", lot_w, lot_d)}[side]


def _footprint_rooms(layout):
    return [r for r in layout["floors"][0].get("rooms", []) if all(k in r for k in "xywd")]


def _validate_site(layout, lot_w, lot_d, errors, warnings):
    site = layout.get("site")
    if not site:
        return
    rooms = _footprint_rooms(layout)
    fence = site.get("fence")
    if fence:
        sides = fence.get("sides", ["front", "back", "left", "right"])
        if any(s not in SIDE_NAMES for s in sides):
            errors.append("Hang rao: sides chi gom front, back, left, right")
        if not 0.5 <= float(fence.get("height", 1.6)) <= 3:
            errors.append("Hang rao: height phai tu 0.5 den 3m")
        gates = fence.get("gates", [])
        for i, g in enumerate(gates):
            side = g.get("side")
            if side not in sides:
                errors.append(f"Hang rao: cong {i} nam tren canh '{side}' khong co rao")
                continue
            length = _side_line(side, lot_w, lot_d)[2]
            if float(g.get("offset", 0)) < 0 or float(g.get("offset", 0)) + float(g.get("width", 0)) > length + EPS or float(g.get("width", 0)) <= 0:
                errors.append(f"Hang rao: cong {i} vuot qua canh {side} dai {length:g}m")
        if "front" in sides and not any(g.get("side") == "front" for g in gates):
            warnings.append("Hang rao mat tien chua co cong")
    zones = site.get("garden", [])
    for z in zones:
        label = f"San vuon '{z.get('id')}'"
        if z.get("type") not in ZONE_TYPES:
            errors.append(f"{label}: type phai la mot trong {', '.join(ZONE_TYPES)}")
            continue
        try:
            x, y, w, d = (float(z[k]) for k in "xywd")
        except (KeyError, TypeError, ValueError):
            errors.append(f"{label} thieu x/y/w/d")
            continue
        if w <= 0 or d <= 0 or x < -EPS or y < -EPS or x + w > lot_w + EPS or y + d > lot_d + EPS:
            errors.append(f"{label} tran ra ngoai lo dat {lot_w}x{lot_d}m")
        if any(_overlap_area(z, r) > 0.01 for r in rooms):
            errors.append(f"{label} de len nha (chong voi phong tang 1)")
    for i, a in enumerate(zones):
        for b in zones[i + 1:]:
            same_layer = (a.get("type") in BASE_ZONES) == (b.get("type") in BASE_ZONES)
            if same_layer and _overlap_area(a, b) > 0.01:
                errors.append(f"San vuon '{a.get('id')}' chong len '{b.get('id')}'")
    for t in site.get("trees", []):
        label = f"Cay '{t.get('id')}'"
        if t.get("kind", "tree") not in ("tree", "shrub"):
            errors.append(f"{label}: kind phai la tree hoac shrub")
        try:
            x, y = float(t["x"]), float(t["y"])
        except (KeyError, TypeError, ValueError):
            errors.append(f"{label} thieu x/y")
            continue
        if not (0 <= x <= lot_w and 0 <= y <= lot_d):
            errors.append(f"{label} nam ngoai lo dat")
        if any(r["x"] - EPS <= x <= r["x"] + r["w"] + EPS and r["y"] - EPS <= y <= r["y"] + r["d"] + EPS for r in rooms):
            errors.append(f"{label} nam trong nha")


def _site_parts(parts, layout):
    site = layout.get("site")
    if not site:
        return
    lot_w, lot_d = float(layout["lot"]["width"]), float(layout["lot"]["depth"])
    for z in site.get("garden", []):
        rgb, z0, z1 = ZONE_TYPES[z["type"]]
        part = _new_part(parts, f"san-vuon-{z['id']}", f"Sân vườn · {z.get('name') or ZONE_NAMES[z['type']]}", "garden", 1,
                         material=ZONE_MATERIALS[z["type"]])
        box(part, rgb, z["x"], z["x"] + z["w"], z["y"], z["y"] + z["d"], z0, z1)
    for t in site.get("trees", []):
        x, y = float(t["x"]), float(t["y"])
        crown = _new_part(parts, f"cay-{t['id']}", f"Sân vườn · {'Bụi cây' if t.get('kind') == 'shrub' else 'Cây'} {t['id']}",
                          "garden", 1, material="leaves")
        if t.get("kind", "tree") == "shrub":
            for dx, dy, dz, r in ((0, 0, 0.45, 0.5), (0.3, 0.15, 0.35, 0.38), (-0.28, -0.12, 0.38, 0.4), (0.05, -0.3, 0.6, 0.32)):
                _blob(crown, TREE_COLORS["shrub"], x + dx, y + dy, dz, r, r * 0.85)
        else:
            trunk = _new_part(parts, f"cay-{t['id']}-than", f"Sân vườn · Thân cây {t['id']}", "garden", 1, material="bark")
            _prism(trunk, TREE_COLORS["trunk"], x, y, 0.0, 2.2, 0.14, 0.09)
            for dx, dy, dz, r in ((0, 0, 3.0, 1.25), (0.7, 0.3, 2.6, 0.9), (-0.65, -0.25, 2.7, 0.95), (0.2, -0.6, 2.5, 0.85),
                                  (-0.25, 0.6, 2.55, 0.85), (0.1, 0.1, 3.7, 0.8)):
                _blob(crown, TREE_COLORS["crown"], x + dx, y + dy, dz, r, r * 0.8)
    fence = site.get("fence")
    if not fence:
        return
    height = float(fence.get("height", 1.6))
    gates = fence.get("gates", [])
    solid = fence.get("style", "bars") == "wall"
    for side in fence.get("sides", ["front", "back", "left", "right"]):
        axis, pos, length = _side_line(side, lot_w, lot_d)
        part = _new_part(parts, f"hang-rao-{side}", f"Hàng rào · {SIDE_NAMES[side]}", "fence", 1, material="plaster")
        bars = None if solid else _new_part(parts, f"hang-rao-{side}-song", f"Hàng rào · {SIDE_NAMES[side]} · Song sắt", "railing", 1)
        cursor = 0.0
        spans = []
        for i, g in sorted(((i, g) for i, g in enumerate(gates) if g.get("side") == side), key=lambda item: item[1]["offset"]):
            start, end = float(g["offset"]), float(g["offset"]) + float(g["width"])
            spans.append((cursor, start))
            gate = _new_part(parts, f"cong-{i}", f"Hàng rào · Cổng {g.get('name') or SIDE_NAMES[side]}", "fence", 1)
            _gate(gate, axis, pos, start, end, height)
            cursor = end
        spans.append((cursor, length))
        for a, b in spans:
            _fence_run(part, bars, axis, pos, a, b, height, solid)


def _prism(part, rgb, cx, cy, z0, z1, r0, r1, sides=8):
    """Lang tru tron (than cay) tu z0 len z1, ban kinh r0 o duoi, r1 o tren."""
    ring = lambda z, r: [(cx + r * math.cos(2 * math.pi * k / sides), cy + r * math.sin(2 * math.pi * k / sides), z) for k in range(sides)]
    bottom, top = ring(z0, r0), ring(z1, r1)
    center = _w(cx, cy, (z0 + z1) / 2)
    for k in range(sides):
        quad = [bottom[k], bottom[(k + 1) % sides], top[(k + 1) % sides], top[k]]
        part["faces"].append((rgb, _outward([_w(*v) for v in quad], center)))
    part["faces"].append((rgb, _outward([_w(*v) for v in top], _w(cx, cy, z0))))


_ICO = None


def _blob(part, rgb, cx, cy, cz, r, rz):
    """Khoi tron (tan cay, bui cay): khoi 20 mat chia mot lan (80 mat), dep hon nhieu so voi khoi hop."""
    global _ICO
    if _ICO is None:
        t = (1 + 5 ** 0.5) / 2
        verts = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t),
                 (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
        norm = lambda v: tuple(c / math.sqrt(sum(x * x for x in v)) for c in v)
        verts = [norm(v) for v in verts]
        tris = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
                (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
        faces = []
        for a, b, c in tris:
            va, vb, vc = verts[a], verts[b], verts[c]
            ab, bc, ca = (norm(tuple((p + q) / 2 for p, q in zip(u, v))) for u, v in ((va, vb), (vb, vc), (vc, va)))
            faces += [(va, ab, ca), (ab, vb, bc), (ca, bc, vc), (ab, bc, ca)]
        _ICO = faces
    center = _w(cx, cy, cz)
    for tri in _ICO:
        poly = [_w(cx + v[0] * r, cy + v[1] * r, cz + v[2] * rz) for v in tri]
        part["faces"].append((rgb, _outward(poly, center)))


def _fence_run(wall, bars, axis, pos, a, b, height, solid):
    """Doan hang rao giua hai cong: tuong thap 0.6m + tru moi <= 3m + song sat (hoac tuong dac khi style wall)."""
    if b - a < EPS:
        return
    if solid or bars is None:
        _wall_piece(wall, CATEGORY_COLORS["fence"], axis, pos, a, b, 0, height, t=FENCE_T)
        return
    base = min(0.6, height * 0.4)
    _wall_piece(wall, CATEGORY_COLORS["fence"], axis, pos, a, b, 0, base, t=0.18)
    _wall_piece(wall, CATEGORY_COLORS["trim"], axis, pos, a, b, base, base + 0.05, t=0.24)
    n = max(1, math.ceil((b - a) / 3.0))
    for k in range(n + 1):
        p = a + (b - a) * k / n
        _slab(wall, CATEGORY_COLORS["fence"], axis, pos, p - 0.15, p + 0.15, -0.15, 0.15, 0, height)
        _slab(wall, CATEGORY_COLORS["trim"], axis, pos, p - 0.19, p + 0.19, -0.19, 0.19, height, height + 0.06)
    _slab(bars, CATEGORY_COLORS["railing"], axis, pos, a, b, -0.02, 0.02, height - 0.12, height - 0.08)
    count = max(1, int((b - a) / 0.13))
    for k in range(count):
        p = a + (b - a) * (k + 0.5) / count
        _slab(bars, CATEGORY_COLORS["railing"], axis, pos, p - 0.01, p + 0.01, -0.01, 0.01, base + 0.05, height - 0.08)


def _gate(part, axis, pos, a, b, height):
    """Cong sat: khung bao, song dung, hai canh."""
    h = height * 0.95
    for s0, s1, z0, z1 in ((a, a + 0.05, 0.05, h), (b - 0.05, b, 0.05, h), (a, b, h - 0.05, h), (a, b, 0.05, 0.1), (a, b, h * 0.45, h * 0.45 + 0.04)):
        _slab(part, GATE_COLOR, axis, pos, s0, s1, -0.025, 0.025, z0, z1)
    mid = (a + b) / 2
    _slab(part, GATE_COLOR, axis, pos, mid - 0.02, mid + 0.02, -0.025, 0.025, 0.05, h)
    count = max(2, int((b - a) / 0.12))
    for k in range(count):
        p = a + (b - a) * (k + 0.5) / count
        _slab(part, GATE_COLOR, axis, pos, p - 0.01, p + 0.01, -0.01, 0.01, 0.1, h - 0.05)


def _site_svg(layout, ox, oy, scale, legend):
    """legend None: chi ve hinh, khong ghi nhan (dung cho lop mo o tang tren)."""
    site = layout.get("site")
    if not site:
        return []
    out = []
    for z in sorted(site.get("garden", []), key=lambda z: z.get("type") not in BASE_ZONES):
        rgb = ZONE_TYPES.get(z.get("type"), ZONE_TYPES["lawn"])[0]
        color = "#%02x%02x%02x" % tuple(int(c * 255) for c in rgb)
        x, y, w, d = ox + z["x"] * scale, oy + z["y"] * scale, z["w"] * scale, z["d"] * scale
        out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{d:.1f}" fill="{color}" fill-opacity="0.55" stroke="{color}"/>')
        if legend is not None:
            name = z.get("name") or ZONE_NAMES.get(z.get("type"), "")
            cx, cy = z["x"] + z["w"] / 2, z["y"] + z["d"] / 2
            covered = z.get("type") in BASE_ZONES and any(
                o is not z and o["x"] - 0.8 <= cx <= o["x"] + o["w"] + 0.8 and o["y"] - 0.5 <= cy <= o["y"] + o["d"] + 0.5
                for o in site.get("garden", []))
            if covered:  # nen san bi khu khac de len giua: ghi vao chu giai
                legend.append(name)
                out.append(f'<text x="{x + 4:.1f}" y="{y + 11:.1f}" font-size="9" fill="#234">({len(legend)})</text>')
            else:
                out.extend(_label_svg(name, x + w / 2, y + d / 2, w, d, legend, fill="#234"))
    for t in site.get("trees", []):
        r = 0.45 if t.get("kind") == "shrub" else 0.9
        out.append(f'<circle cx="{ox + t["x"] * scale:.1f}" cy="{oy + t["y"] * scale:.1f}" r="{r * scale:.1f}" fill="#4d8540" fill-opacity="0.6" stroke="#2f5a26"/>')
    fence = site.get("fence")
    if fence:
        lot_w, lot_d = float(layout["lot"]["width"]), float(layout["lot"]["depth"])
        for side in fence.get("sides", ["front", "back", "left", "right"]):
            axis, pos, length = _side_line(side, lot_w, lot_d)
            cuts = sorted((float(g["offset"]), float(g["offset"]) + float(g["width"])) for g in fence.get("gates", []) if g.get("side") == side)
            cursor = 0.0
            for a, b in cuts + [(length, length)]:
                if a > cursor:
                    if axis == "h":
                        out.append(f'<line x1="{ox + cursor * scale:.1f}" y1="{oy + pos * scale:.1f}" x2="{ox + a * scale:.1f}" y2="{oy + pos * scale:.1f}" stroke="#444" stroke-width="3"/>')
                    else:
                        out.append(f'<line x1="{ox + pos * scale:.1f}" y1="{oy + cursor * scale:.1f}" x2="{ox + pos * scale:.1f}" y2="{oy + a * scale:.1f}" stroke="#444" stroke-width="3"/>')
                cursor = max(cursor, b)
    return out


def _shifted(layout, dx, dy):
    moved = json.loads(json.dumps(layout))
    for floor in moved["floors"]:
        for item in floor.get("rooms", []) + floor.get("furniture", []):
            item["x"] = round(item["x"] + dx, 4)
            item["y"] = round(item["y"] + dy, 4)
    return moved


EXAMPLE_MODERN = {
    "name": "Nhà hiện đại chữ L mái lệch",
    "lot": {"width": 14, "depth": 20},
    "floor_height": 3.3,
    "roof": {"type": "shed", "pitch_deg": 10, "overhang": 0.5, "slope_to": "back"},
    "floors": [
        {"rooms": [
            {"id": "khach", "name": "Phòng khách", "type": "living", "x": 2, "y": 4, "w": 5.6, "d": 6},
            {"id": "sanh", "name": "Sảnh", "type": "hall", "x": 7.6, "y": 4, "w": 1.2, "d": 6},
            {"id": "ngu1", "name": "Ngủ ông bà", "type": "bedroom", "x": 8.8, "y": 4, "w": 3.2, "d": 6},
            {"id": "bep", "name": "Bếp + ăn", "type": "kitchen", "x": 2, "y": 10, "w": 5.6, "d": 4.5},
            {"id": "thang1", "name": "Cầu thang", "type": "stairs", "x": 7.6, "y": 10, "w": 1.2, "d": 4.5, "up": "+y"},
            {"id": "gieng1", "name": "Giếng trời", "type": "void", "x": 2, "y": 14.5, "w": 3.2, "d": 2},
            {"id": "wc1", "name": "WC", "type": "wc", "x": 5.2, "y": 14.5, "w": 2.4, "d": 2}],
         "openings": [
            {"room": "khach", "side": "front", "offset": 2.0, "width": 1.4, "kind": "door"},
            {"room": "khach", "side": "front", "offset": 0.3, "width": 1.4, "kind": "window"},
            {"room": "khach", "side": "back", "offset": 1.5, "width": 1.2},
            {"room": "ngu1", "side": "left", "offset": 1.0, "width": 0.9},
            {"room": "ngu1", "side": "front", "offset": 0.8, "width": 1.6, "kind": "window"},
            {"room": "ngu1", "side": "right", "offset": 2.0, "width": 1.6, "kind": "window"},
            {"room": "bep", "side": "left", "offset": 1.5, "width": 1.4, "kind": "window"},
            {"room": "wc1", "side": "left", "offset": 0.6, "width": 0.8}]},
        {"rooms": [
            {"id": "ngu2", "name": "Ngủ chính", "type": "bedroom", "x": 2, "y": 7, "w": 5.6, "d": 4},
            {"id": "ngu3", "name": "Ngủ con", "type": "bedroom", "x": 2, "y": 11, "w": 4.4, "d": 3.5},
            {"id": "hanhlang", "name": "Hành lang", "type": "hall", "x": 6.4, "y": 11, "w": 1.2, "d": 3.5},
            {"id": "thang2", "name": "Cầu thang", "type": "stairs", "x": 7.6, "y": 10, "w": 1.2, "d": 4.5, "up": "+y"},
            {"id": "gieng2", "name": "Giếng trời", "type": "void", "x": 2, "y": 14.5, "w": 3.2, "d": 2},
            {"id": "wc2", "name": "WC", "type": "wc", "x": 5.2, "y": 14.5, "w": 2.4, "d": 2}],
         "openings": [
            {"room": "ngu2", "side": "front", "offset": 0.8, "width": 1.6, "kind": "window"},
            {"room": "ngu2", "side": "front", "offset": 3.5, "width": 0.9},
            {"room": "ngu2", "side": "back", "offset": 4.5, "width": 0.9},
            {"room": "ngu3", "side": "right", "offset": 1.0, "width": 0.9},
            {"room": "ngu3", "side": "left", "offset": 1.0, "width": 1.4, "kind": "window"},
            {"room": "ngu3", "side": "back", "offset": 0.6, "width": 1.6, "kind": "window"},
            {"room": "wc2", "side": "front", "offset": 1.3, "width": 0.8}]},
    ],
}


def site_example():
    """Nha mau lui vao 2m ben trai va 3m phia truoc, tren lo 9x24m co san vuon, hang rao, cong va cay."""
    layout = _shifted(EXAMPLE, 2, 3)
    layout["name"] = "Nhà phố có sân vườn 9x24m"
    layout["lot"] = {"width": 9, "depth": 24}
    layout["site"] = {
        "fence": {"height": 1.6, "sides": ["front", "back", "left", "right"],
                  "gates": [{"side": "front", "offset": 2.5, "width": 3.6, "name": "chính"}]},
        "garden": [
            {"id": "san-truoc", "name": "Sân trước", "type": "paving", "x": 0, "y": 0, "w": 9, "d": 3},
            {"id": "co-trai", "name": "Thảm cỏ trái", "type": "lawn", "x": 0, "y": 3, "w": 2, "d": 17.5},
            {"id": "co-phai", "name": "Thảm cỏ phải", "type": "lawn", "x": 7, "y": 3, "w": 2, "d": 17.5},
            {"id": "vuon-sau", "name": "Vườn sau", "type": "lawn", "x": 0, "y": 20.5, "w": 9, "d": 3.5},
            {"id": "loi-di", "name": "Lối đi", "type": "path", "x": 7.2, "y": 3, "w": 0.8, "d": 17.5},
            {"id": "bon-hoa", "name": "Bồn hoa", "type": "flowerbed", "x": 6, "y": 21.2, "w": 2.4, "d": 1},
        ],
        "trees": [{"id": "cay-1", "kind": "tree", "x": 1.2, "y": 22.6}, {"id": "bui-1", "kind": "shrub", "x": 8.2, "y": 1.2}],
    }
    return layout


def selftest():
    errors, warnings, stats = validate(EXAMPLE)
    assert not errors, errors
    assert stats["rooms"]["bedroom"] == 3, stats
    bad = json.loads(json.dumps(EXAMPLE))
    bad["floors"][0]["rooms"][1]["x"] = 1.0  # chong len cau thang
    bad["floors"][1]["rooms"] = [r for r in bad["floors"][1]["rooms"] if r["type"] != "stairs"]
    bad_errors = validate(bad)[0]
    assert any("chong len nhau" in e for e in bad_errors), bad_errors
    assert any("cau thang" in e for e in bad_errors), bad_errors
    closed = json.loads(json.dumps(EXAMPLE))  # WC tang 2 chi con cua mo ra tuong ngoai
    up = closed["floors"][1]["openings"]
    up.remove({"room": "ngu3", "side": "back", "offset": 0.8, "width": 0.8})
    up.append({"room": "wc2", "side": "left", "offset": 0.5, "width": 0.8})
    assert any("khong di toi duoc phong wc2" in e for e in validate(closed)[0]), validate(closed)[0]
    # --- cau thang: canh thong voi phong chung khong co tuong; loi len/xuong khong bi chan
    open_side = [p for p in build_parts(EXAMPLE)
                 if p["category"] == "wall" and p["floor"] == 1 and "x=3.8" in p["name"] and "Phòng khách" in p["name"]]
    assert not open_side, "tuong khach-thang phai mo het: khong con bo phan tuong nao"
    assert any(p["id"] == "t2-lan-can" for p in build_parts(EXAMPLE)), "can lan can quanh lo thang"
    assert _flatten_holes([(0, 2, 0.9, 3), (1, 3, 0, 3)]) == [(0, 1, 0.9, 3), (1, 3, 0, 3)]
    top = {}  # tang tren cung: canh giap sanh chi mo khoang dau tren (y 9.5..10.5), con lai lan can; canh giap phong ngu van la tuong
    _open_link_holes(top, EXAMPLE["floors"][1]["rooms"], EXAMPLE["floors"][0], 3.4, has_upper=False)
    assert sorted(top[("v", 3.8)]) == [(5.5, 8.5, RAILING_H, 3.4), (8.5, 9.5, RAILING_H, 3.4), (9.5, 10.5, 0.0, 3.4)], top[("v", 3.8)]

    def with_up(up, closed_top=False):
        layout = json.loads(json.dumps(EXAMPLE))
        if closed_top:  # sanh hoac hanh lang canh dau tren cau thang thanh phong ngu: dau tren chi con tuong
            next(r for r in layout["floors"][1]["rooms"] if r["id"] == closed_top)["type"] = "bedroom"
        for f in layout["floors"]:
            for r in f["rooms"]:
                if r["type"] == "stairs":
                    r["up"] = up
        return validate(layout)[0]

    assert not with_up("+y"), with_up("+y")
    assert any("dau tren cau thang thang2" in e for e in with_up("-y", "hanh-lang2")), with_up("-y", "hanh-lang2")  # di nguoc, khong con hanh lang o dau tren
    assert any("dau tren cau thang thang2" in e for e in with_up("+y", "sanh2")), with_up("+y", "sanh2")
    assert any("up 'len'" in e for e in with_up("len")), with_up("len")
    # --- loi di: khong xuyen qua than cau thang, khong xuyen qua phong rieng, khong tinh duong vong ra san
    boxed = {"lot": {"width": 10, "depth": 12}, "floor_height": 3.4, "roof": {"type": "hip"}, "floors": [
        {"rooms": [{"id": "sanh", "name": "Sảnh", "type": "hall", "x": 0, "y": 0, "w": 2.4, "d": 3},
                   {"id": "khach", "name": "Khách", "type": "living", "x": 2.4, "y": 0, "w": 4, "d": 6.3},
                   {"id": "thang", "name": "Thang", "type": "stairs", "x": 0, "y": 3, "w": 2.4, "d": 3.3, "shape": "U", "up": "+y"},
                   {"id": "bep", "name": "Bếp", "type": "kitchen", "x": 0, "y": 6.3, "w": 6.4, "d": 3},
                   {"id": "ngu", "name": "Ngủ", "type": "bedroom", "x": 6.4, "y": 0, "w": 3, "d": 6.3}],
         "openings": [{"room": "sanh", "side": "front", "offset": 0.6, "width": 1},
                      {"room": "khach", "side": "left", "offset": 3.1, "width": 0.9},
                      {"room": "khach", "side": "back", "offset": 1, "width": 0.9},
                      {"room": "bep", "side": "back", "offset": 1, "width": 0.9},
                      {"room": "ngu", "side": "left", "offset": 1, "width": 0.9}]},
        {"rooms": [{"id": "sanh2", "name": "Sảnh", "type": "hall", "x": 0, "y": 0, "w": 2.4, "d": 3},
                   {"id": "thang2", "name": "Thang", "type": "stairs", "x": 0, "y": 3, "w": 2.4, "d": 3.3, "shape": "U", "up": "+y"}], "openings": []}]}
    found = " | ".join(validate(boxed)[0])
    assert "mo vao than cau thang" in found, found
    walled = json.loads(json.dumps(boxed))
    walled["floors"][0]["rooms"][0].update(w=2.2)  # sanh tach khoi phong ben canh: chi con cua vao than thang
    found = " | ".join(validate(walled)[0])
    assert "khong di toi duoc phong bep" in found, found  # cua sau cua bep khong cuu duoc loi di trong nha
    through = json.loads(json.dumps(EXAMPLE))  # bo hanh lang: ngu 1 chi vao duoc qua ngu 2
    f2 = through["floors"][1]
    f2["rooms"] = [dict(r, w=3.8) if r["id"] == "ngu2" else r for r in f2["rooms"] if r["id"] != "hanh-lang2"]
    assert any("vao ngu1 phai di xuyen qua phong rieng" in e for e in validate(through)[0]), validate(through)[0]
    # --- tu xep noi that: hop le, du do, khong chan cua o moi nha mau
    for path in sorted(EXAMPLES.glob("*.json")):
        auto = furnish(json.loads(path.read_text(encoding="utf-8")), replace=True)
        f_errors, f_warnings, _ = validate(auto)
        assert not f_errors, (path.name, f_errors)
        assert not [w for w in f_warnings if "mon do" in w or "chua co" in w], (path.name, f_warnings)
    # --- loi QLD-233: cua o canh thong phai co tuong, cua ra gieng troi / khoang khong la loi, san thuong ho khong co tran
    doored = json.loads(json.dumps(EXAMPLE_MODERN))
    doored["floors"][0]["openings"].append({"room": "khach", "side": "right", "offset": 2.0, "width": 1.0})  # khach-sanh: canh thong
    assert not _open_links(_valid_rooms(doored["floors"][0]["rooms"]), doored["floors"][0]) or all(
        "khach" not in (a["id"], b["id"]) or "sanh" not in (a["id"], b["id"]) for a, b, _seg in _open_links(
            _valid_rooms(doored["floors"][0]["rooms"]), doored["floors"][0]))
    assert any({"khach", "sanh"} == {a["id"], b["id"]} for a, b, _seg in _open_links(_valid_rooms(doored["floors"][0]["rooms"])))
    door_wall = [p for p in build_parts(doored) if p["category"] == "wall" and p["floor"] == 1 and "x=7.6" in p["name"]]
    assert any(max(pt[1] for pt in poly) - min(pt[1] for pt in poly) > 3.0 and max(pt[2] for pt in poly) - min(pt[2] for pt in poly) > 1.0
               for p in door_wall for _rgb, poly in p["faces"]), "canh co cua phai co tuong"
    void_door = json.loads(json.dumps(EXAMPLE_MODERN))
    void_door["floors"][1]["openings"].append({"room": "ngu3", "side": "back", "offset": 2.2, "width": 0.8})
    assert any("gieng troi" in e for e in validate(void_door)[0]), validate(void_door)[0]
    air = json.loads(json.dumps(EXAMPLE_MODERN))
    air["floors"][1]["openings"].append({"room": "ngu3", "side": "left", "offset": 2.4, "width": 0.8})
    assert any("khoang khong" in e for e in validate(air)[0]), validate(air)[0]
    edge = json.loads(json.dumps(EXAMPLE))
    logia = next(r for f in edge["floors"] for r in f["rooms"] if r["type"] in ("balcony", "porch"))
    edge_floor = next(f for f in edge["floors"] if logia in f["rooms"])
    edge_floor["openings"] += [{"room": logia["id"], "side": side, "offset": 0.3, "width": 0.8} for side in SIDE_NAMES]
    assert any("mep ngoai ban cong" in e for e in validate(edge)[0]), validate(edge)[0]
    open_window = json.loads(json.dumps(EXAMPLE))
    ground = open_window["floors"][0]
    a, _b, s = _open_links(_valid_rooms(ground["rooms"]), ground)[0]
    side = next(k for k in SIDE_NAMES if _opening_segment(a, {"side": k, "offset": 0, "width": 0.1})[:2] == s[:2])
    ground["openings"].append({"room": a["id"], "side": side, "kind": "window", "width": 0.6,
                               "offset": s[2] + 0.1 - float(a["x"] if s[0] == "h" else a["y"])})
    assert any("canh thong" in e for e in validate(open_window)[0]), validate(open_window)[0]
    open_terrace = dict(EXAMPLE_MODERN, roof={"type": "hip", "blocks": [{"x": 2, "y": 7, "w": 5.6, "d": 7.5}]})
    tran_faces = next(p for p in build_parts(open_terrace) if p["id"] == "tran")["faces"]
    assert max(pt[0] for _rgb, poly in tran_faces for pt in poly) <= 7.6 + 0.01, "san thuong / phan ngoai khoi mai khong co tran"
    sofa = {rgb for rgb, _poly in load_obj(ASSETS / load_catalog()["sofa-3"]["obj"], load_catalog()["sofa-3"]["tones"])}
    bed = {rgb for rgb, _poly in load_obj(ASSETS / load_catalog()["giuong-doi"]["obj"], load_catalog()["giuong-doi"]["tones"])}
    assert len(sofa) >= 2 and len(bed) >= 4 and not sofa & bed, "moi mon noi that co bang mau rieng"
    assert any("cung mot mau" in w for w in validate(dict(EXAMPLE, colors={"categories": {"furniture": "#a68a6a"}}))[1])
    assert _linear(1.0) == 1.0 and abs(_linear(0.5) - 0.2140) < 1e-3
    tree = {"id": "x", "category": "garden", "material": "leaves"}
    assert resolve_color(tree, {"categories": {"garden": "#ffffff"}}) is None and resolve_color(dict(tree, material="grass"), {"categories": {"garden": "#ffffff"}})
    empty_room = json.loads(json.dumps(EXAMPLE))
    empty_room["floors"][0]["furniture"] = [f for f in empty_room["floors"][0]["furniture"] if f["room"] != "khach"]
    assert any("phong khach" in w and "mon do" in w for w in validate(empty_room)[1]), validate(empty_room)[1]
    # --- hien co cot, vach kinh, lam che nang
    porch_house = json.loads(json.dumps(EXAMPLE_MODERN))
    g = porch_house["floors"][0]
    g["rooms"] = [dict(r, y=r["y"] + 2, d=r["d"] - 2) if r["id"] in ("khach", "sanh", "ngu1") else r for r in g["rooms"]]
    g["rooms"].append({"id": "hien", "name": "Hiên", "type": "porch", "x": 2, "y": 4, "w": 10, "d": 2})
    g["openings"] = [o for o in g["openings"] if not (o["room"] == "khach" and o["side"] == "front")] + [
        {"room": "khach", "side": "front", "offset": 0.4, "width": 4.4, "kind": "glass-wall"}]
    g["louvers"] = [{"room": "ngu1", "side": "right", "kind": "vertical"}]
    p_err, p_warn, _ = validate(porch_house)
    assert not p_err, p_err
    porch_parts = {p["id"]: p for p in build_parts(porch_house)}
    assert _porch_columns(0, 4.5, []) == [0, 2.25, 4.5]
    assert _porch_columns(0, 4.5, [(1.5, 3.1)]) == [0, 4.5], "khong cot nao dung truoc cua"
    assert _porch_columns(0, 6, [(2.2, 3.8)]) == [0, 1.8, 4.2, 6]
    assert any(p["category"] == "column" for p in porch_parts.values())
    porch_house = {"lot": {"width": 10, "depth": 14}, "roof": {"type": "hip"}, "floors": [{"rooms": [
        {"id": "hien", "name": "Hiên", "type": "porch", "x": 2, "y": 2, "w": 5, "d": 1.5},
        {"id": "khach", "name": "Khách", "type": "living", "x": 2, "y": 3.5, "w": 5, "d": 5}],
        "openings": [{"room": "khach", "side": "front", "offset": 1.7, "width": 1.6}]}]}
    for kind in COLUMN_STYLES:
        shapes = [p for p in build_parts(dict(porch_house, facade={"column": kind})) if p["category"] == "column"]
        assert shapes and all(p["faces"] for p in shapes), kind
        tall = [poly for p in shapes for _c, poly in p["faces"] if max(q[1] for q in poly) - min(q[1] for q in poly) > 1.2]
        xs = sorted({round(sum(q[0] for q in poly) / len(poly)) for poly in tall})
        assert xs == [2, 7], (kind, xs)  # chi hai goc ngoai: khong cot truoc cua, khong cot dinh tuong
    assert any("facade.column" in e for e in validate(dict(porch_house, facade={"column": "tre"}))[0])
    assert porch_parts["t1-mai-hien"]["faces"] and porch_parts["t1-lam"]["category"] == "frame"
    assert porch_parts["t1-khach-vach-kinh-front-" + str(len(g["openings"]) - 1)]["category"] == "glass"
    assert not p_warn, p_warn
    assert any("kind 'cua-tron'" in e for e in validate(dict(EXAMPLE, floors=[dict(EXAMPLE["floors"][0], openings=EXAMPLE["floors"][0]["openings"] + [
        {"room": "khach", "side": "left", "offset": 0.2, "width": 0.5, "kind": "cua-tron"}]), EXAMPLE["floors"][1]]))[0])
    # --- tron mai, mansard, mai chong cap
    for kind in ("mansard", "tiered"):
        roofed = {p["id"]: p for p in build_parts(dict(EXAMPLE, roof={"type": kind}))}
        heights = [pt[1] for _rgb, poly in roofed["mai"]["faces"] for pt in poly]
        assert max(heights) - min(heights) > 1.0, kind
        assert ("mai-cua-so" in roofed) == (kind == "mansard"), kind
    mixed = dict(EXAMPLE_MODERN, roof={"type": "hip", "blocks": [
        {"x": 2, "y": 7, "w": 5.6, "d": 7.5, "type": "hip"},
        {"x": 7.6, "y": 10, "w": 1.2, "d": 4.5, "type": "flat"},
        {"x": 5.2, "y": 14.5, "w": 2.4, "d": 2, "type": "shed", "slope_to": "back"}]})
    m_err, m_warn, _ = validate(mixed)
    assert not m_err and not m_warn, (m_err, m_warn)
    mixed_parts = {p["id"]: p for p in build_parts(mixed)}
    assert mixed_parts["mai-tuong"]["faces"] and mixed_parts["mai"]["faces"]
    partial = dict(EXAMPLE_MODERN, roof={"type": "hip", "blocks": [{"x": 2, "y": 7, "w": 5.6, "d": 7.5}]})
    assert any("khong nam trong khoi mai" in w for w in validate(partial)[1]), validate(partial)[1]
    assert any("roof.blocks[0]" in e for e in validate(dict(EXAMPLE, roof={"type": "hip", "blocks": [{"x": 0, "y": 0, "w": 50, "d": 5}]}))[0])
    # --- tang ham, tang lung, chieu cao rieng tung tang
    deep = json.loads(json.dumps(EXAMPLE))
    deep["floors"][1]["height"] = 3.0
    assert [round(b, 3) for b, _h in _levels(deep)] == [PLINTH, round(PLINTH + 3.4, 3)]
    roof_bottom = min(pt[1] for _rgb, poly in next(p for p in build_parts(deep) if p["id"] == "tran")["faces"] for pt in poly)
    assert abs(roof_bottom - (PLINTH + 3.4 + 3.0)) < 1e-6, roof_bottom
    cellar = json.loads(json.dumps(EXAMPLE))
    ham = json.loads(json.dumps(EXAMPLE["floors"][0]))
    ham.update(kind="basement", height=2.8, furniture=[])
    ham["rooms"] = [r for r in ham["rooms"] if r["type"] in ("stairs",)] + [
        {"id": "kho-ham", "name": "Kho hầm", "type": "hall", "x": 0, "y": 5.5, "w": 3.8, "d": 5}]
    ham["openings"] = []
    cellar["floors"].insert(0, ham)
    c_errors = validate(cellar)[0]
    assert not c_errors, c_errors
    assert _floor_names(cellar["floors"]) == {1: "Tang ham", 2: "Tang 1", 3: "Tang 2"}
    assert _levels(cellar)[0][0] < 0 and abs(_levels(cellar)[1][0] - PLINTH) < 1e-9, _levels(cellar)
    c_parts = {p["id"] for p in build_parts(cellar)}
    assert any(k.startswith("t2-tam-cap-") for k in c_parts) and not any(k.startswith("t1-tam-cap-") for k in c_parts)
    bad_cellar = json.loads(json.dumps(cellar))
    bad_cellar["floors"][1]["rooms"] = [r for r in bad_cellar["floors"][1]["rooms"] if r["type"] != "stairs"]
    assert any(e.startswith("Tang ham:") or e.startswith("Tang 1:") for e in validate(bad_cellar)[0]), validate(bad_cellar)[0]
    assert any("tang ham (kind basement) chi duoc" in e for e in validate(dict(EXAMPLE, floors=[EXAMPLE["floors"][0], dict(EXAMPLE["floors"][1], kind="basement")]))[0])
    # --- cau thang chu U va chu L: chan va dau thang o dung cho
    u_house = {"name": "thang U", "lot": {"width": 6, "depth": 8}, "floor_height": 3.2, "floors": [
        {"rooms": [{"id": "thang1", "type": "stairs", "x": 3, "y": 0, "w": 2.4, "d": 3, "shape": "U", "up": "-y"},
                   {"id": "khach", "type": "living", "x": 0, "y": 0, "w": 3, "d": 4.5},
                   {"id": "sanh", "type": "hall", "x": 3, "y": 3, "w": 2.4, "d": 1.5}],
         "openings": [{"room": "khach", "side": "front", "offset": 1, "width": 1.2},
                      {"room": "khach", "side": "left", "offset": 1, "width": 1.4, "kind": "window"}]},
        {"rooms": [{"id": "thang2", "type": "stairs", "x": 3, "y": 0, "w": 2.4, "d": 3, "shape": "U", "up": "-y"},
                   {"id": "ngu", "type": "bedroom", "x": 0, "y": 0, "w": 3, "d": 4.5},
                   {"id": "sanh2", "type": "hall", "x": 3, "y": 3, "w": 2.4, "d": 1.5}],
         "openings": [{"room": "ngu", "side": "right", "offset": 3.3, "width": 0.9},
                      {"room": "ngu", "side": "left", "offset": 1, "width": 1.4, "kind": "window"}]}]}
    assert not validate(u_house)[0], validate(u_house)[0]
    u_plan = _stair_plan(u_house["floors"][0]["rooms"][0])
    assert len(u_plan["flights"]) == 2 and len(u_plan["landings"]) == 1
    assert u_plan["entry"][0] == ("h", 3.0, 4.2, 5.4) and u_plan["arrival"][0] == ("h", 3.0, 3.0, 4.2), u_plan
    u_parts = {p["id"]: p for p in build_parts(u_house)}
    tops = sorted({round(max(pt[1] for pt in poly), 3) for _rgb, poly in u_parts["t1-thang1-cau-thang"]["faces"]})
    assert abs(tops[-1] - (PLINTH + 3.2)) < 1e-6 and any(abs(t - (PLINTH + 1.6)) < 1e-6 for t in tops), tops
    blocked_u = json.loads(json.dumps(u_house))
    blocked_u["floors"][1]["rooms"][2]["type"] = "storage"  # sanh tang 2 thanh kho: dau tren bi chan
    assert any("dau tren cau thang thang2" in e for e in validate(blocked_u)[0]), validate(blocked_u)[0]
    l_house = json.loads(json.dumps(u_house))
    for f in l_house["floors"]:
        f["rooms"][0]["shape"] = "L"
    l_plan = _stair_plan(l_house["floors"][0]["rooms"][0])
    assert l_plan["flights"][1][4] == "v+" and abs(l_plan["flights"][0][6] - l_plan["flights"][1][5]) < 1e-9
    assert any("chu U can o rong" in e for e in validate({**u_house, "floors": [
        {**u_house["floors"][0], "rooms": [dict(u_house["floors"][0]["rooms"][0], w=1.2)] + u_house["floors"][0]["rooms"][1:]},
        u_house["floors"][1]]})[0])
    narrow = json.loads(json.dumps(EXAMPLE))
    narrow["floors"][0]["rooms"].append({"id": "kho-hep", "type": "hall", "x": 0, "y": 0, "w": 0.5, "d": 0.5})
    assert any("hep 0.5m" in w for w in validate(narrow)[1]), validate(narrow)[1]
    parts = build_parts(EXAMPLE)
    ids = [p["id"] for p in parts]
    assert len(ids) == len(set(ids)), "partId bi trung"
    assert ids == [p["id"] for p in build_parts(EXAMPLE)], "partId khong on dinh"
    cats = {p["category"] for p in parts}
    assert {"floor", "wall", "door", "glass", "stairs", "roof"} <= cats, cats
    assert any(p["id"] == "t1-gara-cua-front-0" for p in parts), ids
    # layout cu khong co colors: khong bo phan nao bi ghi de mau
    assert all(resolve_color(p, EXAMPLE.get("colors", {})) is None for p in parts)
    colored = dict(EXAMPLE, colors={"categories": {"roof": "#112233"},
                                    "parts": {"t1-gara-san": "#ff0000", "khong-ton-tai": "#00ff00"}})
    roof = next(p for p in build_parts(colored) if p["id"] == "mai")
    assert resolve_color(roof, colored["colors"]) == (0x11 / 255, 0x22 / 255, 0x33 / 255)
    assert product_slug("Nhà phố 2 tầng 5x20m") == "nha-pho-2-tang-5x20m"
    assert product_slug("Đình làng / Biệt thự!") == "dinh-lang-biet-thu"
    assert product_slug("") == "mo-hinh-nha"
    with tempfile.TemporaryDirectory() as tmp:
        parts = build(colored, tmp)
        assert not Path(tmp, "model.glb").exists(), "file 3D phai dat ten theo san pham"
        glb = Path(tmp, "nha-pho-2-tang-5x20m.glb").read_bytes()
        magic, version, total = struct.unpack("<III", glb[:12])
        assert (magic, version, total) == (0x46546C67, 2, len(glb)), "header GLB sai"
        json_len, json_type = struct.unpack("<II", glb[12:20])
        assert json_type == 0x4E4F534A
        gltf = json.loads(glb[20:20 + json_len])
        nodes = gltf["nodes"]
        assert nodes[0]["name"] == "Nhà", nodes[0]
        assert sum(1 for n in nodes if "partId" in n.get("extras", {})) == len(parts)
        # cay node phai la cay that: moi node (tru goc) co dung 1 cha, khong node nao la con cua chinh no
        parents = {}
        for index, node in enumerate(nodes):
            for child in node.get("children", []):
                assert child != index, f"node {index} ({node['name']}) la con cua chinh no"
                assert child not in parents, f"node {child} co 2 cha"
                parents[child] = index
        assert set(parents) == set(range(1, len(nodes))), "co node khong noi vao cay"
        assert all("partId" in nodes[i].get("extras", {}) for i, n in enumerate(nodes) if "mesh" in n)
        # three.js lam sach ten node (doi dau cach, dau cham thanh _), nen giu ten goc trong extras.name
        gara = next(n for n in nodes if n.get("extras", {}).get("partId") == "t1-gara-san")
        assert gara["extras"]["name"] == "T1 · Gara · Sàn", gara["extras"]
        assert any(m["pbrMetallicRoughness"]["baseColorFactor"][:3] == [1.0, 0.0, 0.0] for m in gltf["materials"])
        assert not Path(tmp, "viewer.html").exists(), "khong con xuat viewer.html"
        assert Path(tmp, "iso.svg").stat().st_size > 1000 and Path(tmp, "plan.svg").stat().st_size > 1000
    # --- noi that
    furn = [p for p in build_parts(EXAMPLE) if p["category"] == "furniture"]
    assert len(furn) >= 3 and all(p["faces"] for p in furn), len(furn)
    assert any(p["id"] == "t2-ngu1-giuong" for p in furn), [p["id"] for p in furn]

    def with_item(item, floor_index=0):
        layout = json.loads(json.dumps(EXAMPLE))
        for f in layout["floors"]:  # bo xe o to trong gara de thu tung mon do mot
            f["furniture"] = [x for x in f["furniture"] if x["room"] != "gara"]
        layout["floors"][floor_index]["furniture"].append(item)
        return validate(layout)[0]

    assert not with_item({"id": "giuong-x", "item": "giuong-don", "room": "gara", "x": 4.08, "y": 2.0, "rotation": 270})
    assert any("tran ra ngoai" in e for e in with_item({"id": "giuong-x", "item": "giuong-don", "room": "gara", "x": 4.38, "y": 2.0, "rotation": 270}))
    assert any("chan cua" in e for e in with_item({"id": "ghe-x", "item": "ghe", "room": "gara", "x": 1.7, "y": 5.1, "rotation": 0}))
    assert any("catalog" in e for e in with_item({"id": "la", "item": "khong-co", "room": "gara", "x": 2, "y": 2, "rotation": 0}))
    schema_path = Path(__file__).resolve().parents[2] / "kien-truc-nha-o" / "schemas" / "layout.schema.json"
    if schema_path.exists():  # chi co khi chay trong goi studio-nha-3d
        props = json.loads(schema_path.read_text(encoding="utf-8"))["properties"]
        assert "colors" in props, "layout.schema thieu colors"
        furn_schema = props["floors"]["items"]["properties"]["furniture"]["items"]
        assert furn_schema["properties"]["rotation"]["enum"] == [0, 90, 180, 270]
        for item in EXAMPLE["floors"][0]["furniture"]:
            assert set(furn_schema["required"]) <= set(item), item
        spec_props = json.loads(schema_path.with_name("spec.schema.json").read_text(encoding="utf-8"))["properties"]
        assert "colors" in spec_props and "furniture_notes" in spec_props["rooms"]["items"]["properties"]
    # --- san vuon, hang rao, cong, cay
    site = site_example()
    site_errors, _, _ = validate(site)
    assert not site_errors, site_errors
    site_parts = {p["id"]: p for p in build_parts(site)}
    assert site_parts["hang-rao-front"]["category"] == "fence"
    assert site_parts["cong-0"]["category"] == "fence"
    assert site_parts["san-vuon-san-truoc"]["category"] == "garden"
    assert site_parts["cay-cay-1"]["category"] == "garden" and len(site_parts["cay-cay-1"]["faces"]) >= 6 * 80
    assert site_parts["cay-cay-1"]["material"] == "leaves" and site_parts["cay-cay-1-than"]["material"] == "bark"
    assert site_parts["san-vuon-san-truoc"]["material"] == "paving" and site_parts["hang-rao-front-song"]["category"] == "railing"
    solid_site = json.loads(json.dumps(site))
    solid_site["site"]["fence"]["style"] = "wall"
    assert "hang-rao-front-song" not in {p["id"] for p in build_parts(solid_site)}

    def site_errors_with(change):
        layout = json.loads(json.dumps(site))
        change(layout["site"])
        return validate(layout)[0]

    assert any("de len nha" in e for e in site_errors_with(lambda s: s["garden"].append(
        {"id": "x", "type": "lawn", "x": 3, "y": 5, "w": 2, "d": 2})))
    assert any("tran ra ngoai lo dat" in e for e in site_errors_with(lambda s: s["garden"].append(
        {"id": "x", "type": "paving", "x": 8, "y": 1, "w": 3, "d": 1})))
    assert any("chong len" in e for e in site_errors_with(lambda s: s["garden"].append(
        {"id": "x", "type": "lawn", "x": 0, "y": 0, "w": 2, "d": 2})))
    assert not site_errors_with(lambda s: s["garden"].append(
        {"id": "ho", "type": "pool", "x": 3, "y": 21, "w": 2, "d": 1.5}))  # ho nam tren tham co: hop le
    assert any("cong" in e for e in site_errors_with(lambda s: s["fence"]["gates"].append(
        {"side": "left", "offset": 22, "width": 3})))
    assert any("cay" in e for e in site_errors_with(lambda s: s["trees"].append(
        {"id": "cay-x", "kind": "tree", "x": 4, "y": 10})))
    with tempfile.TemporaryDirectory() as tmp:
        build(site, tmp)
        site_glb = Path(tmp, f"{product_slug(site['name'])}.glb").read_bytes()
        site_json_len = struct.unpack("<I", site_glb[12:16])[0]
        site_nodes = json.loads(site_glb[20:20 + site_json_len])["nodes"]
        assert any(n.get("extras", {}).get("category") == "fence" for n in site_nodes)
        assert any(n.get("extras", {}).get("material") == "grass" for n in site_nodes), "GLB phai mang goi y chat lieu"
        assert "Sân trước" in Path(tmp, "plan.svg").read_text(encoding="utf-8")
    # --- do that: khung cua, cua cuon gara, cot nen, tam cap, lan can, dien mai, phong cach mat tien
    real = {p["id"]: p for p in build_parts(EXAMPLE)}
    assert real["t1-gara-cua-front-0-khung"]["category"] == "frame" and real["t1-gara-cua-front-0"]["faces"]
    assert len(real["t1-gara-cua-front-0"]["faces"]) > 60, "cua cuon gara phai co nhieu nan ngang"
    assert real["t1-khach-kinh-left-2-khung"]["category"] == "frame"
    assert real["nen-nha"]["category"] == "trim" and any(k.startswith("t1-tam-cap-") for k in real), sorted(real)
    assert real["t1-lan-can"]["category"] == "railing", "ban cong / san sau phai co lan can"
    assert real["mai-dien"]["faces"] and real["t1-thang1-tay-vin"]["category"] == "railing"
    floor_z = min(pt[1] for _rgb, poly in real["t1-khach-san"]["faces"] for pt in poly)
    assert abs(floor_z - (PLINTH - SLAB_T)) < 1e-6, floor_z  # nha nang len cot nen
    flat = {p["id"]: p for p in build_parts(dict(EXAMPLE, plinth=0))}
    assert "nen-nha" not in flat and not any(k.startswith("t1-tam-cap-") for k in flat)
    for style in FACADE_STYLES:
        styled = {p["id"]: p for p in build_parts(dict(EXAMPLE_MODERN, facade={"style": style}))}
        assert styled["t2-san-thuong-lan-can"]["faces"], style
        assert ("t2-go-tang" in styled) == FACADE_STYLES[style]["band"], style
    assert "t2-san-thuong-lan-can-kinh" in {p["id"] for p in build_parts(dict(EXAMPLE_MODERN, facade={"style": "modern"}))}
    assert any("facade.style" in e for e in validate(dict(EXAMPLE, facade={"style": "gothic"}))[0])
    assert any("facade.railing" in e for e in validate(dict(EXAMPLE, facade={"railing": "go"}))[0])
    # --- hinh khoi: nha chu L, mai lech, san thuong, gieng troi
    m_errors, m_warnings, _ = validate(EXAMPLE_MODERN)
    assert not m_errors and not m_warnings, (m_errors, m_warnings)
    modern = {p["id"]: p for p in build_parts(EXAMPLE_MODERN)}
    assert modern["t2-san-thuong-lan-can"]["faces"] and any(k.startswith("t2-san-thuong-0") for k in modern), sorted(modern)
    assert "t2-gieng2-san" not in modern and "t1-gieng1-san" in modern, "gieng troi tang tren khong co san"
    holes = {}
    _open_link_holes(holes, EXAMPLE_MODERN["floors"][1]["rooms"], EXAMPLE_MODERN["floors"][0], 3.3, has_upper=False)
    assert all(z0 == RAILING_H for s_, e_, z0, z1 in holes.get(("h", 14.5), [])), holes  # khong co phong chung canh gieng
    low = {}
    _open_link_holes(low, EXAMPLE_MODERN["floors"][0]["rooms"], None, 3.3, has_upper=True)
    assert (2.0, 5.2, 0.0, 3.3) in low[("h", 14.5)], low[("h", 14.5)]  # bep thong ra gieng troi o tang 1
    roof_z = [pt[1] for _rgb, poly in modern["mai"]["faces"] for pt in poly]
    assert max(roof_z) - min(roof_z) > 1.0, "mai lech phai co do doc"
    gap = json.loads(json.dumps(EXAMPLE_MODERN))
    gap["floors"][1]["rooms"] = [r for r in gap["floors"][1]["rooms"] if r["id"] != "hanhlang"]
    assert any("khong thuoc phong nao" in w for w in validate(gap)[1]), validate(gap)[1]
    xs, ys = _grid(EXAMPLE_MODERN["floors"][0]["rooms"])
    l_cells = _cells(EXAMPLE_MODERN["floors"][0]["rooms"], xs, ys)
    assert len(_roof_rects(l_cells, xs, ys)) >= 2 and len(_cover_rects(l_cells, xs, ys)) >= 2
    for kind in ("hip", "gable", "flat"):
        assert build_parts(dict(EXAMPLE_MODERN, roof={"type": kind}))[-1]["faces"], kind
    assert any("slope_to" in e for e in validate(dict(EXAMPLE_MODERN, roof={"type": "shed", "slope_to": "len"}))[0])
    # --- bo nha mau theo kieu: deu phai qua validate khong loi, khong canh bao
    for path in sorted(EXAMPLES.glob("*.json")):
        e_errors, e_warnings, _ = validate(json.loads(path.read_text(encoding="utf-8")))
        assert not e_errors and not e_warnings, (path.name, e_errors, e_warnings)
    table = catalog_table()
    assert "giuong-doi" in table and "Giường đôi" in table and "bedroom" in table, table[:200]
    big = json.loads(json.dumps(EXAMPLE))
    big["floors"].insert(1, json.loads(json.dumps(EXAMPLE["floors"][1])))  # nha 3 tang
    assert sum(len(f.get("furniture", [])) for f in big["floors"]) >= 15
    with tempfile.TemporaryDirectory() as tmp:
        build(big, tmp)
        size = Path(tmp, f"{product_slug(big.get('name'))}.glb").stat().st_size
    print(f"selftest OK: {len(parts)} bo phan, {len(furn)} mon noi that, {len(glb)} bytes GLB, nha 3 tang {size // 1024} KB GLB")


# ---------------------------------------------------------------- tu xep noi that

ROOM_MARGIN = 0.09   # cach tim tuong (nua be day tuong + khe) de do khong an vao tuong
SIDE_ROTATION = {"front": 180, "back": 0, "left": 90, "right": 270}  # mon do dua lung vao canh `side`, mat nhin vao phong


class _Placer:
    """Dat do trong mot phong, dung chung luat voi validate: khong chong nhau, khong chan cua, khong che cua so bang do cao."""

    def __init__(self, floor, room, doors, catalog):
        self.floor, self.room, self.catalog = floor, room, catalog
        self.x0, self.y0 = room["x"] + ROOM_MARGIN, room["y"] + ROOM_MARGIN
        self.x1, self.y1 = room["x"] + room["w"] - ROOM_MARGIN, room["y"] + room["d"] - ROOM_MARGIN
        self.zones = [(a, p - DOOR_CLEARANCE, b, p + DOOR_CLEARANCE) if ax == "h" else (p - DOOR_CLEARANCE, a, p + DOOR_CLEARANCE, b)
                      for ax, p, a, b in doors]
        if room.get("type") != "hall":  # canh thong khong co tuong: khong dua lung do vao, khong chan loi
            rooms = _valid_rooms(floor["rooms"])
            for ra, rb, (ax, p, a, b) in _open_links(rooms, floor) + _void_links(rooms, floor):
                if room["id"] in (ra["id"], rb["id"]):
                    self.zones.append((a, p - OPEN_EDGE_CLEARANCE, b, p + OPEN_EDGE_CLEARANCE) if ax == "h"
                                      else (p - OPEN_EDGE_CLEARANCE, a, p + OPEN_EDGE_CLEARANCE, b))
        self.windows = {side: [] for side in SIDE_ROTATION}
        for o in floor.get("openings", []):
            if o.get("room") == room["id"] and o.get("kind") in ("window", "glass-wall") and o.get("side") in self.windows:
                self.windows[o["side"]].append(_opening_segment(room, o)[2:])
        self.furniture = [f for f in floor.get("furniture", []) if f.get("room") == room["id"]]
        self.rects = []
        for f in self.furniture:
            item = catalog.get(f.get("item"))
            if item and not item.get("stack"):
                self.rects.append(_footprint(float(f["x"]), float(f["y"]), int(f.get("rotation", 0)), item))

    @property
    def area(self):
        return self.room["w"] * self.room["d"]

    @property
    def narrow(self):
        return min(self.room["w"], self.room["d"])

    def count(self, prefix=None):
        return sum(1 for f in self.furniture if prefix is None or f["item"].startswith(prefix))

    def fits(self, rect, pad=0.04):
        x0, y0, x1, y1 = rect
        if x0 < self.x0 - 0.01 or y0 < self.y0 - 0.01 or x1 > self.x1 + 0.01 or y1 > self.y1 + 0.01:
            return False
        if any(_rect_overlap(rect, z) > 0.001 for z in self.zones):
            return False
        wide = (x0 - pad, y0 - pad, x1 + pad, y1 + pad)
        return not any(_rect_overlap(wide, r) > 0.002 for r in self.rects)

    def add(self, code, x, y, rotation):
        item = self.catalog[code]
        used = {f["id"] for f in self.furniture}
        base = code
        fid, n = base, 1
        while fid in used:
            n += 1
            fid = f"{base}-{n}"
        f = {"id": fid, "item": code, "room": self.room["id"], "x": round(x, 3), "y": round(y, 3), "rotation": rotation}
        self.furniture.append(f)
        self.floor["furniture"].append(f)
        if not item.get("stack"):
            self.rects.append(_footprint(x, y, rotation, item))
        return f

    def put(self, code, x, y, rotation, pad=0.04):
        rect = _footprint(x, y, rotation, self.catalog[code])
        if self.catalog[code].get("stack") or self.fits(rect, pad):
            return self.add(code, x, y, rotation)
        return None

    def wall_point(self, code, side, t):
        """Tam mon do khi dua lung vao canh `side`, o vi tri t doc canh."""
        item = self.catalog[code]
        off = item["d"] / 2
        if side == "front":
            return t, self.y0 + off
        if side == "back":
            return t, self.y1 - off
        if side == "left":
            return self.x0 + off, t
        return self.x1 - off, t

    def span(self, side):
        return (self.x0, self.x1) if side in ("front", "back") else (self.y0, self.y1)

    def blocked_by_window(self, code, side, t):
        """Do cao dung che cua so cung tuong."""
        item = self.catalog[code]
        if item["h"] < 1.15:
            return False
        half = item["w"] / 2
        return any(t - half < b and t + half > a for a, b in self.windows[side])

    def positions(self, code, side, prefer=None):
        lo, hi = self.span(side)
        half = self.catalog[code]["w"] / 2
        a, b = lo + half, hi - half
        if b < a - 0.001:
            return []
        mid = (a + b) / 2 if prefer is None else min(max(prefer, a), b)
        out, step, k = [mid], 0.1, 1
        while mid - k * step >= a - 0.001 or mid + k * step <= b + 0.001:
            out += [t for t in (mid - k * step, mid + k * step) if a - 0.001 <= t <= b + 0.001]
            k += 1
        for t in (a, b):
            out.append(t)
        return out

    def against(self, code, sides, prefer=None, where=None, window_ok=True):
        """Dua mon do vao mot trong cac canh; where(t, side) loc vi tri. Tra ve (mon do, canh, t) hoac None."""
        for side in sides:
            for t in self.positions(code, side, prefer):
                if where and not where(t, side):
                    continue
                if not window_ok and self.blocked_by_window(code, side, t):
                    continue
                if self.catalog[code]["h"] >= 1.15 and self.blocked_by_window(code, side, t):
                    continue
                x, y = self.wall_point(code, side, t)
                if self.put(code, x, y, SIDE_ROTATION[side]):
                    return self.furniture[-1], side, t
        return None

    def corners(self, code, limit=None):
        """Dat mon do vao cac goc phong (xa nhau), tra ve so mon dat duoc."""
        item = self.catalog[code]
        w, d = item["w"] / 2, item["d"] / 2
        spots = [(self.x0 + w, self.y0 + d, 180), (self.x1 - w, self.y0 + d, 180), (self.x0 + w, self.y1 - d, 0), (self.x1 - w, self.y1 - d, 0)]
        done = 0
        for x, y, rot in spots:
            if limit is not None and done >= limit:
                break
            if self.put(code, x, y, rot):
                done += 1
        return done

    def free_sides(self):
        """Canh phong xep theo do trong: khong co cua truoc, roi it cua so, roi dai hon."""
        def score(side):
            lo, hi = self.span(side)
            door = 0
            for z in self.zones:
                if side in ("front", "back"):
                    edge = self.room["y"] if side == "front" else self.room["y"] + self.room["d"]
                    near = z[1] - 0.9 <= edge <= z[3] + 0.9 and z[0] < hi and z[2] > lo
                else:
                    edge = self.room["x"] if side == "left" else self.room["x"] + self.room["w"]
                    near = z[0] - 0.9 <= edge <= z[2] + 0.9 and z[1] < hi and z[3] > lo
                door += 1 if near else 0
            return (door, len(self.windows[side]), -(hi - lo))
        return sorted(SIDE_ROTATION, key=score)


def _fill_bedroom(p):
    big = p.narrow >= 2.9 and p.area >= 9.5
    bed = "giuong-doi" if big else "giuong-don"
    sides = p.free_sides()
    headless = lambda t, side: not any(t - p.catalog[bed]["w"] / 2 < b and t + p.catalog[bed]["w"] / 2 > a for a, b in p.windows[side])
    placed = p.against(bed, sides, where=headless) or p.against(bed, sides)
    if placed is None and bed == "giuong-doi":
        placed = p.against("giuong-don", sides)
        bed = "giuong-don"
    if placed:
        _f, side, t = placed
        item = p.catalog[bed]
        for sign in (-1, 1):
            tt = t + sign * (item["w"] / 2 + p.catalog["tu-dau-giuong"]["w"] / 2 + 0.04)
            x, y = p.wall_point("tu-dau-giuong", side, tt)
            p.put("tu-dau-giuong", x, y, SIDE_ROTATION[side], pad=0.01)
        if p.area >= 12:
            x, y = p.wall_point(bed, side, t)
            p.add("tham", x, y, 0)
    if p.area >= 14:
        p.against("tu-quan-ao", p.free_sides(), window_ok=False)
    p.against("tu-quan-ao", p.free_sides(), window_ok=False)
    if p.area >= 10 and p.count("ban-lam-viec") == 0:
        got = p.against("ban-lam-viec", p.free_sides())
        if got:
            _d, side, t = got
            desk = p.catalog["ban-lam-viec"]
            chair = p.catalog["ghe-lam-viec"]
            reach = desk["d"] + chair["d"] / 2 + 0.05
            nx, ny = {"front": (t, p.y0 + reach), "back": (t, p.y1 - reach), "left": (p.x0 + reach, t), "right": (p.x1 - reach, t)}[side]
            p.put("ghe-lam-viec", nx, ny, (SIDE_ROTATION[side] + 180) % 360)
    if p.area >= 16 and placed:
        p.against("ke-tivi", [{"front": "back", "back": "front", "left": "right", "right": "left"}[placed[1]]], prefer=placed[2])
        tv = next((f for f in p.furniture if f["item"] == "ke-tivi"), None)
        if tv:
            p.add("tivi", tv["x"], tv["y"], tv["rotation"])
    p.corners("den-cay", 1)
    p.corners("cay-canh", 1)


def _fill_living(p):
    opposite = {"front": "back", "back": "front", "left": "right", "right": "left"}
    sofa_code = "sofa-dai" if p.area >= 24 and p.narrow >= 3.5 else "sofa-3"
    best = None
    for code in (sofa_code, "sofa-3"):
        for side in p.free_sides():
            other = opposite[side]
            lo, hi = p.span(side)
            depth = (p.y1 - p.y0) if side in ("front", "back") else (p.x1 - p.x0)
            room_for = depth - p.catalog[code]["d"] - p.catalog["ke-tivi"]["d"]
            if room_for < 1.4:
                continue
            for t in p.positions(code, side):
                x, y = p.wall_point(code, side, t)
                if not p.fits(_footprint(x, y, SIDE_ROTATION[side], p.catalog[code])):
                    continue
                tv = next((u for u in p.positions("ke-tivi", other, t)
                           if abs(u - t) < 1.2 and p.fits(_footprint(*p.wall_point("ke-tivi", other, u), SIDE_ROTATION[other], p.catalog["ke-tivi"]))), None)
                if tv is None:
                    continue
                far = abs(room_for - 2.6)  # khoang cach sofa - tivi dep nhat khoang 2.6m
                score = (0 if not any(abs(t - (a + b) / 2) < 0.7 for a, b in p.windows[side]) else 1, far, abs(t - (lo + hi) / 2), abs(tv - t))
                if best is None or score < best[0]:
                    best = (score, code, side, t, other, tv)
        if best:
            break
    if best is None:
        p.against("sofa-3", p.free_sides())
        p.against("ke-tivi", p.free_sides())
    else:
        _s, code, side, t, other, tv_t = best
        sx, sy = p.wall_point(code, side, t)
        p.add(code, sx, sy, SIDE_ROTATION[side])
        kx, ky = p.wall_point("ke-tivi", other, tv_t)
        p.add("ke-tivi", kx, ky, SIDE_ROTATION[other])
        p.add("tivi", kx, ky, SIDE_ROTATION[other])
        gap = p.catalog[code]["d"] + 0.42 + p.catalog["ban-tra"]["d"] / 2
        dx, dy = {"front": (0, 1), "back": (0, -1), "left": (1, 0), "right": (-1, 0)}[side]
        bx, by = ((t, p.y0 + gap) if side == "front" else (t, p.y1 - gap) if side == "back" else (p.x0 + gap, t) if side == "left" else (p.x1 - gap, t))
        table_rot = SIDE_ROTATION[side]
        if p.put("ban-tra", bx, by, table_rot):
            p.add("tham", bx, by, 0 if side in ("front", "back") else 90)
        along = 1.55
        for sign in (-1, 1):  # ghe thu gian o hai dau ban tra, quay vao ban
            cx, cy = (bx + sign * along, by) if side in ("front", "back") else (bx, by + sign * along)
            rot = (90 if sign < 0 else 270) if side in ("front", "back") else (180 if sign < 0 else 0)
            p.put("ghe-thu-gian", cx, cy, rot)
            if p.area < 18:
                break
    p.corners("cay-canh", 2 if p.area >= 18 else 1)
    p.corners("den-cay", 1)
    if p.area >= 16:
        p.against("ke-sach", p.free_sides(), window_ok=False)


def _fill_dining_set(p, seats):
    table = p.catalog["ban-an"]
    chair = p.catalog["ghe"]
    best = None
    for rot, pull in ((0, 0.5), (90, 0.5), (0, 0.32), (90, 0.32)):  # uu tien cho keo ghe thoang, hep qua thi bot
        if best is not None and pull < 0.5:
            break
        reach = pull + chair["d"] / 2  # ghe + cho keo ghe
        w, d = (table["w"], table["d"]) if rot == 0 else (table["d"], table["w"])
        # ghe o hai canh dai; hai dau ban chi co ghe khi 6 cho
        rx = reach if rot == 90 or seats >= 6 else 0.1
        ry = reach if rot == 0 or seats >= 6 else 0.1
        x = p.x0 + w / 2 + rx
        while x <= p.x1 - w / 2 - rx + 0.001:
            y = p.y0 + d / 2 + ry
            while y <= p.y1 - d / 2 - ry + 0.001:
                rect = (x - w / 2 - rx, y - d / 2 - ry, x + w / 2 + rx, y + d / 2 + ry)
                if p.fits(rect, pad=0.02):
                    score = abs(x - (p.x0 + p.x1) / 2) + abs(y - (p.y0 + p.y1) / 2)
                    if best is None or score < best[0]:
                        best = (score, x, y, rot)
                y += 0.15
            x += 0.15
    if best is None:
        return False
    _s, x, y, rot = best
    p.add("ban-an", x, y, rot)
    half_w, half_d = table["w"] / 2, table["d"] / 2
    spots = []
    for k in ((-0.35, 0.35) if seats >= 4 else (0.0,)):  # 2 cho: moi ben mot ghe
        if rot == 0:
            spots += [(x + k, y - half_d - chair["d"] / 2 - 0.05, 180), (x + k, y + half_d + chair["d"] / 2 + 0.05, 0)]
        else:
            spots += [(x - half_d - chair["d"] / 2 - 0.05, y + k, 90), (x + half_d + chair["d"] / 2 + 0.05, y + k, 270)]
    if seats >= 6:
        if rot == 0:
            spots += [(x - half_w - chair["d"] / 2 - 0.05, y, 90), (x + half_w + chair["d"] / 2 + 0.05, y, 270)]
        else:
            spots += [(x, y - half_w - chair["d"] / 2 - 0.05, 180), (x, y + half_w + chair["d"] / 2 + 0.05, 0)]
    for cx, cy, r in spots:
        p.put("ghe", cx, cy, r, pad=0.0)
    return True


def _fill_kitchen(p):
    run = ["tu-lanh", "tu-bep", "bon-rua-bat", "tu-bep-ngan-keo", "bep-nau", "tu-bep"]
    done = False
    for side in p.free_sides():
        total = sum(p.catalog[c]["w"] for c in run)
        for modules in (run, run[1:], run[2:]):
            total = sum(p.catalog[c]["w"] for c in modules)
            lo, hi = p.span(side)
            if hi - lo < total:
                continue
            start = lo
            while start + total <= hi + 0.001:
                cursor, plan, ok = start, [], True
                for code in modules:
                    w = p.catalog[code]["w"]
                    t = cursor + w / 2
                    x, y = p.wall_point(code, side, t)
                    rect = _footprint(x, y, SIDE_ROTATION[side], p.catalog[code])
                    if not p.fits(rect, pad=0.0) or (p.catalog[code]["h"] >= 1.15 and p.blocked_by_window(code, side, t)):
                        ok = False
                        break
                    plan.append((code, x, y, t))
                    cursor += w
                if ok:
                    for code, x, y, _t in plan:
                        p.add(code, x, y, SIDE_ROTATION[side])
                    for code, x, y, t in plan:  # tu treo tren tu duoi, tranh cua so va tu lanh
                        if code in ("tu-bep", "tu-bep-ngan-keo") and not any(t - 0.3 < b and t + 0.3 > a for a, b in p.windows[side]):
                            p.add("tu-bep-tren", x, y, SIDE_ROTATION[side])
                    done = True
                    break
                start += 0.1
            if done:
                break
        if done:
            break
    if p.area >= 9:
        any(_fill_dining_set(p, n) for n in ((6, 4, 2) if p.area >= 18 else (4, 2)))


def _fill_wc(p):
    sides = p.free_sides()
    if p.area >= 3.5:
        p.corners("voi-sen", 1) or p.against("voi-sen", sides, window_ok=True)
    p.against("bon-cau", sides)
    sink = "tu-lavabo" if p.area >= 4 else "lavabo"
    got = p.against(sink, sides) or p.against("lavabo", sides)
    if got:
        _f, side, t = got
        x, y = p.wall_point("guong", side, t)
        p.add("guong", x, y, SIDE_ROTATION[side])
    if p.area >= 6:
        p.corners("cay-canh", 1)


def _fill_by_type(p):
    kind = p.room.get("type")
    if kind == "bedroom":
        _fill_bedroom(p)
    elif kind == "living":
        _fill_living(p)
    elif kind == "kitchen":
        _fill_kitchen(p)
    elif kind == "dining":
        any(_fill_dining_set(p, n) for n in ((6, 4, 2) if p.area >= 10 else (4, 2)))
        p.corners("cay-canh", 1)
        if p.area >= 12:
            p.against("ke-tivi", p.free_sides())
    elif kind == "wc":
        _fill_wc(p)
    elif kind == "worship":
        p.against("ban-tho", ["back", "left", "right", "front"], window_ok=True)
        p.corners("cay-canh", 2)
    elif kind == "laundry":
        p.against("may-giat", p.free_sides())
        p.against("bon-rua-bat", p.free_sides())
        p.against("ke-sach", p.free_sides(), window_ok=False)
        p.corners("cay-canh", 1)
    elif kind == "storage":
        p.against("ke-sach" if p.area < 5 else "tu-quan-ao", p.free_sides(), window_ok=False)
        if p.area >= 3:
            p.against("ke-sach", p.free_sides(), window_ok=False)
    elif kind == "garage":
        car = p.catalog["xe-oto"]
        x = (p.x0 + p.x1) / 2
        for y in (p.y1 - car["d"] / 2 - 0.15, (p.y0 + p.y1) / 2, p.y0 + car["d"] / 2 + 0.9):
            for cx in (x, x - 0.3, x + 0.3, p.x0 + car["w"] / 2 + 0.2, p.x1 - car["w"] / 2 - 0.2):
                if not p.count("xe-oto") and p.put("xe-oto", cx, y, 0, pad=0.0):
                    break
    elif kind == "hall":
        if p.narrow >= 1.4:
            p.corners("cay-canh", 1)
            if p.area >= 8:
                p.corners("den-cay", 1)
    elif kind in ("balcony", "porch"):
        p.corners("cay-canh", 2 if p.area >= 5 else 1)
        if p.area >= 9 and p.narrow >= 1.8:
            p.against("ghe-thu-gian", p.free_sides())


def furnish(layout, replace=False):
    """Tu xep noi that cho moi phong. replace=True: xoa do cu va xep lai tu dau; mac dinh chi xep phong chua du do.
    Ket qua la diem khoi dau hop le (khong chong, khong chan cua); agent chinh theo y chu du an."""
    catalog = load_catalog()
    for floor in layout["floors"]:
        if replace:
            floor["furniture"] = []
        floor.setdefault("furniture", [])
        doors = _door_segs(floor) + [s for s in ()]
        for room in _valid_rooms(floor.get("rooms", [])):
            if room.get("type") in ("stairs", "void"):
                continue
            p = _Placer(floor, room, doors, catalog)
            rule = FURNISH_MIN.get(room.get("type"), [])
            need = max((n for limit, n in rule if p.area >= limit), default=0)
            if room.get("type") in ("hall", "balcony") and p.narrow < 1.4:
                need = 0  # hanh lang, ban cong hep: giu loi di
                if room.get("type") == "hall":
                    continue
            if not replace and p.count() >= need and (p.count() or not rule):
                continue
            if not p.count():
                _fill_by_type(p)
            for code in ("cay-canh", "den-cay", "ke-sach", "tham"):  # van thieu thi them do nho hop phong
                if p.count() >= need:
                    break
                if room.get("type") in catalog[code]["rooms"]:
                    p.corners(code, need - p.count()) or p.against(code, p.free_sides(), window_ok=False)
    return layout


furnish(EXAMPLE)  # nha mau: moi phong du do theo quy chuan (agent hoc theo mau nay)


def find_textures():
    """Thu muc texture CC0 dung chung voi trinh xem 3D (HOUSE_TEXTURES, Docker, hoac repo)."""
    here = Path(__file__).resolve()
    candidates = [os.environ.get("HOUSE_TEXTURES"), "/app/ui/dist/house-textures", "/app/ui/public/house-textures"]
    if len(here.parents) > 5:
        candidates.append(here.parents[5] / "ui" / "public" / "house-textures")
    for c in candidates:
        if c and Path(c, "sky_1k.hdr").exists():
            return Path(c)
    return None


def render(model, out, samples=96, size="1600x1000"):
    """Anh phoi canh that bang Blender Cycles (CPU). model: file .glb, hoac layout.json (se build truoc)."""
    blender = os.environ.get("BLENDER") or shutil.which("blender")
    if not blender:
        raise SystemExit("Chua cai Blender (lenh 'blender'); dat bien BLENDER neu cai o cho khac")
    textures = find_textures()
    if textures is None:
        raise SystemExit("Khong tim thay thu muc texture (dat bien HOUSE_TEXTURES)")
    model = Path(model)
    with tempfile.TemporaryDirectory() as tmp:
        if model.suffix.lower() == ".json":
            build(json.loads(model.read_text(encoding="utf-8")), tmp)
            model = next(Path(tmp).glob("*.glb"))
        cmd = [blender, "-b", "--factory-startup", "-P", str(Path(__file__).with_name("render_blender.py")), "--",
               str(model), str(Path(out).resolve()), "--textures", str(textures), "--samples", str(samples), "--size", size]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0 or not Path(out).exists():
            raise SystemExit("Blender render loi: " + (result.stdout[-2000:] + result.stderr[-2000:]))
    return Path(out)


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # ten tieng Viet tren console Windows
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    fz = sub.add_parser("furnish")
    fz.add_argument("layout")
    fz.add_argument("--out", help="file ghi ket qua (mac dinh: ghi de layout)")
    fz.add_argument("--replace", action="store_true", help="xoa do cu, xep lai tu dau")
    ex = sub.add_parser("example")
    ex.add_argument("--type", help="ma kieu nha trong examples/ (bo trong: liet ke)")
    sub.add_parser("example-site")
    sub.add_parser("example-modern")
    sub.add_parser("selftest")
    rd = sub.add_parser("render")
    rd.add_argument("model", help="file .glb da build, hoac layout.json")
    rd.add_argument("--out", default="render.png")
    rd.add_argument("--samples", type=int, default=96)
    rd.add_argument("--size", default="1600x1000")
    sub.add_parser("catalog")
    v = sub.add_parser("validate")
    v.add_argument("layout")
    b = sub.add_parser("build")
    b.add_argument("layout")
    b.add_argument("--out", required=True)
    args = parser.parse_args(argv)
    if args.cmd == "example-modern":
        print(json.dumps(EXAMPLE_MODERN, ensure_ascii=False, indent=2))
        return 0
    if args.cmd == "example-site":
        print(json.dumps(site_example(), ensure_ascii=False, indent=2))
        return 0
    if args.cmd == "example":
        if args.type:
            path = EXAMPLES / f"{args.type}.json"
            if not path.exists():
                print(f"Khong co nha mau '{args.type}'. Cac kieu: {', '.join(sorted(p.stem for p in EXAMPLES.glob('*.json')))}")
                return 1
            print(path.read_text(encoding="utf-8"))
            return 0
        print(json.dumps(EXAMPLE, ensure_ascii=False, indent=2))
        kinds = sorted(p.stem for p in EXAMPLES.glob("*.json"))
        if kinds:
            print(f"# Nha mau theo kieu (dung --type): {', '.join(kinds)}", file=sys.stderr)
        return 0
    if args.cmd == "selftest":
        selftest()
        return 0
    if args.cmd == "furnish":
        layout = furnish(json.loads(Path(args.layout).read_text(encoding="utf-8")), args.replace)
        Path(args.out or args.layout).write_text(json.dumps(layout, ensure_ascii=False, indent=2) + chr(10), encoding="utf-8")
        errors, warnings, _ = validate(layout)
        print(json.dumps({"ok": not errors, "errors": errors, "warnings": warnings,
                          "furniture": {str(i): len(f.get("furniture", [])) for i, f in enumerate(layout["floors"], 1)}}, ensure_ascii=False, indent=2))
        return 0
    if args.cmd == "render":
        print(f"Da render {render(args.model, args.out, args.samples, args.size)}")
        return 0
    if args.cmd == "catalog":
        print(catalog_table())
        return 0
    layout = json.loads(Path(args.layout).read_text(encoding="utf-8"))
    errors, warnings, stats = validate(layout)
    print(json.dumps({"ok": not errors, "errors": errors, "warnings": warnings, "stats": stats}, ensure_ascii=False, indent=2))
    if errors:
        return 1
    if args.cmd == "build":
        parts = build(layout, args.out)
        print(f"Da xuat {len(parts)} bo phan vao {args.out}: {product_slug(layout.get('name'))}.glb, plan.svg, iso.svg")
    return 0


if __name__ == "__main__":
    sys.exit(main())
