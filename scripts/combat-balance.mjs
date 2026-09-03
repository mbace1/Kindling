#!/usr/bin/env node
import assert from "node:assert/strict";

const SPECIES = {
  ember: { hp: 26, strike: 6, guard: 4, skill: 7, speed: 6, tendency: "skill-focused" },
  mossling: { hp: 30, strike: 4, guard: 6, skill: 8, speed: 4, tendency: "guard-heavy" },
  ashling: { hp: 20, strike: 8, guard: 2, skill: 6, speed: 9, tendency: "quick-striker" },
  mossknight: { hp: 48, strike: 9, guard: 10, skill: 3, speed: 2, tendency: "counterattacker" },
};

const GROWTH = {
  ember: (r) => ({ hp: r * 2, strike: r, guard: Math.floor(r / 2), skill: r, speed: 0 }),
  mossling: (r) => ({ hp: r * 2, strike: Math.floor(r / 2), guard: r, skill: r, speed: Math.floor((r + 1) / 2) }),
  ashling: (r) => ({ hp: r, strike: r, guard: Math.floor(r / 2), skill: r, speed: r }),
  mossknight: (r) => ({ hp: r * 3, strike: Math.floor(r / 2), guard: r, skill: Math.floor(r / 2), speed: 0 }),
};

function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0x1_0000_0000;
  };
}

function stats(id, rank) {
  const b = SPECIES[id];
  const g = GROWTH[id](rank);
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, typeof v === "number" ? v + (g[k] || 0) : v]));
}
function telegraph(tendency, roll) {
  if (tendency === "guard-heavy") return roll < .55 ? "guard" : roll < .8 ? "strike" : "skill";
  if (tendency === "quick-striker") return roll < .6 ? "strike" : roll < .8 ? "skill" : "guard";
  if (tendency === "counterattacker") return roll < .5 ? "guard" : roll < .8 ? "strike" : "skill";
  return roll < .4 ? "skill" : roll < .75 ? "strike" : "guard";
}
function counter(v) { return v === "strike" ? "guard" : v === "guard" ? "skill" : "strike"; }
function resolve(player, enemy, pc, ec) {
  let pDmg = 0, eDmg = 0;
  const pAtk = player === "skill" ? pc.skill : pc.strike;
  const eAtk = enemy === "skill" ? ec.skill : ec.strike;
  if (player !== "guard") {
    eDmg = Math.max(1, pAtk - (enemy === "guard" ? Math.ceil(ec.guard / 2) : 0));
    if (player === "skill") eDmg += 1;
    if (enemy === "guard" && ec.tendency === "counterattacker") pDmg += 2;
  }
  if (enemy !== "guard") {
    pDmg += Math.max(1, eAtk - (player === "guard" ? Math.ceil(pc.guard / 2) : 0));
    if (enemy === "skill") pDmg += 1;
  }
  if (player === "guard" && enemy === "strike") pDmg = Math.max(0, pDmg - 2);
  return { pDmg, eDmg };
}
function fight(playerId, enemyId, rank, seed) {
  const pc = stats(playerId, rank), ec = stats(enemyId, 0), random = rng(seed);
  let ph = pc.hp, eh = ec.hp, turns = 0;
  while (ph > 0 && eh > 0 && turns++ < 60) {
    const enemy = telegraph(ec.tendency, random());
    const player = counter(enemy);
    const d = resolve(player, enemy, pc, ec);
    ph -= d.pDmg; eh -= d.eDmg;
  }
  return { win: eh <= 0 && ph > 0, hp: Math.max(0, ph), turns };
}

const ids = Object.keys(SPECIES);
const report = {};
for (const player of ids) {
  report[player] = {};
  for (let rank = 0; rank <= 4; rank++) {
    let wins = 0, hp = 0, turns = 0, fights = 0;
    for (const enemy of ids.filter((id) => id !== player)) {
      for (let i = 0; i < 400; i++) {
        const out = fight(player, enemy, rank, 0xC0FFEE + i * 97 + rank * 10007 + ids.indexOf(player) * 100003 + ids.indexOf(enemy) * 1000003);
        fights++; wins += Number(out.win); hp += out.hp; turns += out.turns;
      }
    }
    report[player][rank] = { winRate: wins / fights, avgHp: hp / fights, avgTurns: turns / fights };
  }
  assert.ok(report[player][4].winRate + 0.02 >= report[player][0].winRate, `${player} Elder progression regressed versus Spark`);
}

for (const [id, ranks] of Object.entries(report)) {
  assert.ok(ranks[0].avgTurns > 0 && ranks[4].avgTurns > 0, `${id} produced invalid combat length`);
  assert.ok(ranks[4].avgHp >= ranks[0].avgHp || ranks[4].winRate > ranks[0].winRate, `${id} growth has no measurable combat benefit`);
}
console.log(JSON.stringify({ ok: true, simulations: ids.length * 5 * 3 * 400, report }, null, 2));