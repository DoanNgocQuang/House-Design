import assert from "node:assert/strict";
import test from "node:test";
import { drawOfficeAgentLabels, drawOfficeRoomLabels } from "./office-presentation.mjs";

test("keeps names above characters and shows action text only on interaction", () => {
  const drawn = [];
  const ctx = {
    canvas: { width: 400, height: 250 },
    save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {},
    measureText: value => ({ width: value.length * 7 }),
    fillText: (text, x, y) => drawn.push({ text, x, y }),
  };
  const characters = [
    { id: 1, x: 95, y: 100, state: "idle", officeBreak: { arrived: true, target: { activity: "coffee" } } },
    { id: 2, x: 200, y: 150, state: "type", officeBreak: { arrived: true, target: { activity: "pool" } } },
  ];
  const agents = new Map([[1, { name: "An" }], [2, { name: "Bình" }]]);
  drawOfficeAgentLabels(ctx, characters, agents, (x, y) => ({ x, y }), 1, 1, 6, { hovered: 2 });
  assert.ok(drawn.find(label => label.text === "An").y < 100);
  assert.ok(drawn.find(label => label.text === "Bình").y < 150);
  assert.deepEqual(drawn.map(label => label.text), ["An", "☕", "Bình", "🎱", "Chơi bi-a"]);
});

test("keeps a long room label inside the visible portion of a cropped room", () => {
  const labels = [];
  const ctx = {
    canvas: { width: 280, height: 150 },
    save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {},
    measureText: text => ({ width: text.length * 7 }),
    fillText: (text, x, y, width) => labels.push({ text, x, y, width }),
  };
  drawOfficeRoomLabels(ctx, [{ label: "Phòng Phân tích và Kế hoạch", rect: { col: 3, row: 3, cols: 13, rows: 8 } }],
    { offsetX: -162, offsetY: -65, zoom: 1, tileSize: 16, dpr: 1 });
  assert.equal(labels.length, 2);
  assert.equal(labels.map(item => item.text).join(" "), "Phòng Phân tích và Kế hoạch");
  for (const label of labels) {
    assert.ok(label.x - label.width / 2 >= 0);
    assert.ok(label.x + label.width / 2 <= 94);
    assert.ok(label.y > 0);
  }
});

test("keeps the idle label palette and gives active agents green labels", () => {
  const pills = [];
  const labels = [];
  const ctx = {
    canvas: { width: 400, height: 250 },
    save() {}, restore() {}, beginPath() {}, roundRect() {},
    fill() { pills.push(this.fillStyle); },
    measureText: text => ({ width: text.length * 7 }),
    fillText(text) { labels.push([text, this.fillStyle]); },
  };
  drawOfficeAgentLabels(ctx, [
    { id: 1, x: 80, y: 100, state: "idle" },
    { id: 2, x: 240, y: 140, state: "type", isActive: true },
  ], new Map([[1, { name: "An" }], [2, { name: "Bình" }]]), (x, y) => ({ x, y }), 1, 1, 6, {});
  assert.deepEqual(pills, ["rgba(10, 18, 34, 0.88)", "#dcfce7"]);
  assert.deepEqual(labels, [["An", "#f9fafb"], ["Bình", "#166534"]]);
});
