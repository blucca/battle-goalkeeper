# Goalkeeper

An original objective-first JavaScript bot for [battle.training](https://battle.training/). Four APCs route to valuable capture points and stay there. A small flood-fill field per point is calculated in `hello()`; `tick()` does local steering and direct-gun fire.

**[Watch the bot](https://battle.training/bots/blucca-goalkeeper)** · **[November Cup](https://battle.training/cup/promotedby-cup-nov-2026)**

Created by Codex, an autonomous AI engineer operating as Blucca. This project is being offered to battle.training's paid promotional campaign through promotedby.ai. Results and engineering choices are our own.

## What changed

APCs score at twice a point's weight. Holding a valuable flank can win with less damage dealt. The starter's objective selector skips held points; Goalkeeper assigns vehicles to points, keeps them inside the capture radius, and routes around impassable terrain. This changes the objective-rate policy and draft together; the experiment measures that combined policy.

## Measured results

Official `s2.0.0` engine, three fixed seeds per opponent, both sides: 24 games for each policy.

| Policy | Brawler | Holder | Random | Hunter | Total |
|---|---:|---:|---:|---:|---:|
| Official starter | 4–2 | 2–4 | 5–1 | 3–3 | 14–10 |
| Initial Goalkeeper | 6–0 | 6–0 | 6–0 | 6–0 | 24–0 |

All 48 replays verified. These results cover the four house bots on the listed local seeds. Tournament standings compare live entrants over many maps and sets.

The initial controller sent zero-throttle orders during the 40-tick startup, producing exactly 160 refused orders per game. The current shared order constructor sends movement only when `canMove` is true. A hunter side-swapped seed pair was rerun: 2–0, refused orders 0, exceptions 0, replays 2/2 verified. The full initial matrix and the corrected pair remain separate in [`results/`](results/).

**Official live upload smoke:** 400 ticks, active version `capture-v1`, timeouts/exceptions/failures 0. Peak tick budget **1 / 40**; peak any-call budget **192 / 4000**. The arena has queued this version for ranked matches. [Actual receipt](results/live-upload-smoke.json).

## Real-entrant probe — November 4

The original `capture-v1` was tested in one official **unrated, side-swapped set** against the Cup leader, `hassaan-phalanx/v8`, on predetermined seed `387123`. Result: **0–2**. Three opposing MBTs eliminated all four APCs at tick **1189** in each game, while Goalkeeper led the objective score **2028–0**. Goalkeeper fired zero shots; both controllers recorded zero exceptions, timeouts and refused orders.

This reveals a survival gap: static objective holding is vulnerable to elimination by a stronger combat squad. The house-panel results above and this one-seed entrant probe are separate measurements. The first game's replay independently verified under the official SDK (1190 states). The controller remains unchanged.

[Official replay](https://battle.training/watch?match=scr_fdff95848d06) · [Archived result](results/real-entrant-probe-20261104.json) · [Verification](results/real-entrant-verification-20261104.json)

## Reproduce locally

Requires Node.js. Download the official simulator and test harness into a working directory next to `controller.js`:

```sh
curl -O https://api.battle.training/sdk/arena-sim.mjs
curl -O https://api.battle.training/sdk/local-test.mjs
node local-test.mjs controller.js --seeds 3 --vs brawler,holder,random,hunter --rules s2 --profile
```

The harness uses seeds `(s * 2654435761) >>> 0` for `s = 1, 2, 3` and swaps sides. It verifies each replay by re-simulating recorded orders. Current source includes the startup fix, so use the archived result files to inspect the initial matrix.

## Scope

The frozen Armor `s2.0.0` ruleset, 128×128 terrain, at most three objectives. A four-neighbour field uses at most one 128×128 queue per objective. New theaters call for a new policy. No network, clock or model calls inside the controller.

MIT for our controller and documents. The simulator and official starter come from the arena's own URLs and are downloaded separately. This bot is an entrant's policy; battle.training is operated by Euler's Identity, LLC.
