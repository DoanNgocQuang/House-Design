import test from "node:test";
import assert from "node:assert/strict";
import { createOfficeBreaks } from "./office-breaks.mjs";

test("idle agents use distinct leisure spots and yield to work and meetings", () => {
  const characters = new Map([1, 2, 3].map(id => [id, {
    id, tileCol: id, tileRow: 2, path: [], state: "idle", officeBreakEligible: id !== 3,
  }]));
  const sentToSeat = [];
  const office = {
    characters,
    seats: new Map([["bench", { seatCol: 10, seatRow: 9, facingDir: 0 }]]),
    blockedTiles: new Set(["10,9"]),
    walkableTiles: [{ col: 11, row: 8 }, { col: 14, row: 8 }, { col: 5, row: 8 }],
    getLayout: () => ({ furniture: [
      { type: "COFFEE", col: 11, row: 7 },
      { type: "POOL_TABLE", col: 14, row: 7 },
    ] }),
    withOwnSeatUnblocked: (_character, run) => run(),
    sendToSeat: id => sentToSeat.push(id),
  };
  const update = createOfficeBreaks(office, [
    { role: "meeting", rect: { col: 3, row: 6, cols: 4, rows: 4 } },
    { role: "pantry", rect: { col: 9, row: 6, cols: 8, rows: 5 } },
  ], (_fromCol, _fromRow, col, row) => [{ col, row }], () => ({ footprintW: 1, footprintH: 1 }));

  update(0);
  const [first, second, busy] = characters.values();
  assert.ok(first.officeBreak.target.col >= 9);
  assert.ok(second.officeBreak.target.col >= 9);
  assert.notDeepEqual(first.officeBreak.target, second.officeBreak.target);
  assert.equal(first.officeBreak.target.activity, "coffee");
  assert.equal(second.officeBreak.target.activity, "pool");
  assert.equal(busy.officeBreak, undefined);

  const destination = first.officeBreak.target;
  Object.assign(first, { tileCol: destination.col, tileRow: destination.row, path: [] });
  update(1);
  assert.equal(first.officeBreak.arrived, true);
  assert.equal(first.wanderTimer, Infinity);

  first.isActive = true;
  first.seatId = "desk";
  second.officeMeeting = { target: { col: 5, row: 8 } };
  second.path = [second.officeMeeting.target];
  update(1);
  assert.deepEqual(sentToSeat, [1]);
  assert.equal(first.officeBreak, undefined);
  assert.equal(second.officeBreak, undefined);
  assert.deepEqual(second.path, [{ col: 5, row: 8 }]);
});

test("takes one coffee break, then stays seated for the rest of the idle spell", () => {
  const ch = { id: 1, tileCol: 3, tileRow: 3, path: [], state: "idle", officeBreakEligible: true };
  const office = {
    characters: new Map([[ch.id, ch]]),
    seats: new Map([["bench", { seatCol: 7, seatRow: 3, facingDir: 0 }]]),
    blockedTiles: new Set(),
    walkableTiles: [{ col: 3, row: 3 }, { col: 4, row: 3 }],
    getLayout: () => ({ furniture: [{ type: "COFFEE", col: 3, row: 2 }] }),
    withOwnSeatUnblocked: (_character, run) => run(),
  };
  const update = createOfficeBreaks(office, [{ role: "pantry", rect: { col: 0, row: 0, cols: 9, rows: 6 } }],
    (fromCol, fromRow, col, row) => fromCol === col && fromRow === row ? [] : [{ col, row }], () => null);
  update(0);
  assert.equal(ch.officeBreak.target.activity, "coffee");
  Object.assign(ch, { tileCol: ch.officeBreak.target.col, tileRow: ch.officeBreak.target.row, path: [] });
  update(0);
  update(30);
  assert.equal(ch.officeBreak.target.seatUid, "bench");
  Object.assign(ch, { tileCol: 7, tileRow: 3, path: [] });
  update(1);
  update(3600);
  assert.equal(ch.officeBreak.target.seatUid, "bench");
  assert.equal(ch.state, "type");
  assert.deepEqual(ch.path, []);
});

test("keeps a sitting-only agent in a leisure chair until work resumes", () => {
  const ch = { id: 1, tileCol: 7, tileRow: 3, path: [], state: "idle", officeBreakEligible: true, officeBreakSitOnly: true };
  const sentToSeat = [];
  const office = {
    characters: new Map([[ch.id, ch]]),
    seats: new Map([["bench", { seatCol: 7, seatRow: 3, facingDir: 0 }]]),
    blockedTiles: new Set(),
    walkableTiles: [{ col: 3, row: 3 }, { col: 4, row: 3 }],
    getLayout: () => ({ furniture: [{ type: "COFFEE", col: 3, row: 2 }] }),
    withOwnSeatUnblocked: (_character, run) => run(),
    sendToSeat: id => sentToSeat.push(id),
  };
  const update = createOfficeBreaks(office, [{ role: "pantry", rect: { col: 0, row: 0, cols: 9, rows: 6 } }],
    (fromCol, fromRow, col, row) => fromCol === col && fromRow === row ? [] : [{ col, row }], () => null);
  update(0);
  update(1);
  update(3600);
  assert.equal(ch.officeBreak.target.seatUid, "bench");
  assert.equal(ch.state, "type");
  assert.deepEqual(ch.path, []);
  ch.isActive = true;
  ch.seatId = "desk";
  update(0);
  assert.deepEqual(sentToSeat, [1]);
});
