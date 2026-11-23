# Cubo Trainer

[Español](README.es.md) · **English**

A web app to improve your 3x3 Rubik's cube times (layer-by-layer method) and to learn to solve a 4x4 by reduction: timer with scrambles, per-phase timing, statistics, a last-layer algorithm trainer, a training plan and a move-notation reference. A **3x3 / 4x4** switch in the header changes the whole app between the two puzzles. No installation, account or server of its own needed.

**Use it online:** https://rovkar.github.io/cubo-trainer/

## How to open it

- **Online:** open the link above on your phone or computer. No sign-up needed.
- **Offline:** download the repository and double-click `index.html`. It works straight from disk (`file://`) in any modern browser.

## Timer controls

- **Space** (or **tap the timer area** on mobile): hold for about 0.3 s until it turns green, then release to start. If you release earlier (amber), it won't start.
- **Any key / tap** while it is running: stops the timer.
- **Phase mode**: each press records the end of a phase; the last press stops the timer (N phases = N presses).
- **15 s inspection** (optional): the first press starts the countdown, with warnings at 8 s and 12 s. If you start between 15 and 17 s, +2 is added; after 17 s it is a DNF. **Escape** cancels the inspection.
- Shortcuts are ignored while you type in a text field or a dialog is open.

## 3x3 / 4x4 mode

Next to the title *Cubo Trainer* there is a **3x3 / 4x4** switch. It changes the whole app, not just one tab. Everything that depends on the puzzle is kept separately for each one:

- **Timer**: scrambles for the puzzle in use (4x4 scrambles use `U D L R F B` and the wide moves `Uw`, `Rw`, `Fw`; 40 moves by default, 30 to 60 in the settings) and the phase presets of the puzzle (for the 4x4: reduction, *Centers · Edges · 3x3 stage*, and a detailed one, *Centers · Edges · Cross · F2L · Last layer*). Every new solve is stored with the puzzle it was for.
- **Stats**: solves, numbering, quick stats, the list, ao5/ao12/ao50/ao100, the chart, the phase analysis and the CSV export only count the solves of the puzzle in use. Solves saved before the switch existed are 3x3.
- **Trainer**: the 4x4 mode lists the same 16 last-layer cases with their 4x4 versions (six of them are rewritten, see below). Its status and times are separate from the 3x3 ones.
- **Plan**: the 4x4 mode shows a short 4x4 plan (diagnosis, centers, edge pairing, last layer and parity, lookahead) for someone who already solves the 3x3 with 4LLL. Its goals are skills, not times, and its milestones are separate from the 3x3 plan. The situation card says which puzzle it is for and uses the ao12 of that puzzle.
- **Notation**: the 3x3 or the 4x4 move reference, following the mode.

The mode is a device preference, like the language: it is remembered in this browser (`cubotrainer.ntSize`), it is not part of your profile data and it is not synced. Profiles are shared by both puzzles (the profile selector counts the solves of the puzzle in use).

## Tabs

- **Timer**: scramble (with a net view), timer, settings (inspection, phase mode, hide time, scramble length, show net), quick stats and the last 10 solves with OK / +2 / DNF / delete. Click a time to see its scramble, date and per-phase times.
- **Trainer**: *Learn* shows the 16 last-layer cases with diagram, algorithm, tip and status (New / Learning / Mastered). *Practice* suggests random cases (more often the ones you are learning and the slowest ones): it gives you the setup, you time the execution and then the solution is revealed. After stopping, Space moves to the next case.
- **Stats**: single, ao5, ao12, ao50 and ao100 (current and best), a progress chart with the goal of your current phase, an analysis of which phase loses you the most time, the full solve table and profile management (rename, delete, export CSV, JSON backup, import JSON).
- **Plan**: a phase-by-phase training plan with milestones you can tick off, your current situation based on your ao12 (milestones are per profile), a daily routine and tips.
- **Notation**: in 3x3 mode, one diagram per move letter (U D R L F B, each with `'` and `2`, plus `r`, `f` and `M`, which the Trainer uses), computed from the cube engine. Each one has a physical description of the turn and a *result on a solved cube* self-check. In 4x4 mode it shows the 4x4 section, described below.

## 4x4 section

For solving a 4x4 by reduction (centers, edge pairing, then the 3x3 steps; six of the 16 Trainer algorithms are rewritten for a 4x4, see below). Switch to **4x4** in the header and open the **Notation** tab. It has:

- **4x4 notation**: outer faces (`U D R L F B`; D, L and B carry the same "looks reversed" explanation as the 3x3 tab), inner slice (`2R`), wide moves (`Rw`, `Uw`, `Fw`: the ones the scrambles use), three-layer wide move (`3Rw`, `3Fw`) and whole-cube rotations (`x`, `y`), each with a before/after diagram whose arrows are computed from the 4x4 engine.
- **Last two edges (edge pairing)**: when only two edges are left to pair, slice moves cannot join them. The card (before the parity cards, because it belongs to the reduction stage) explains when you need it, how to hold the cube and bring the two unpaired edges to the left and right vertical edges of the front face with outer turns only (a table by place), and how to recognize the case from the four front stickers. Case 1 (halves that belong together side by side): `Dw R F' U R' F Dw'`. Case 2 (crossed): first `R F' U R' F`, then the case 1 algorithm. Each has numbered steps with a front-view diagram after every step. The recipe was checked on all 16 possible arrangements of the two edges (each built from a solved cube), from both holds it allows, and it pairs both edges while the centers stay solved and the other ten pairs stay paired; it was also checked on random cubes with other edges, on a fixed-permutation argument that covers any other cube, and against the independent simulator. It is *not* parity (parity shows up later, in the last layer).
- **Trainer algorithms on a 4x4**: the Trainer algorithms with `r`, `f` or `M` (T and L orient-corners, L-shape and dot, H and Z) do not work as written on a 4x4: they unpair dedges or use a move that does not exist. The page lists their 4x4 versions (`r` -> `3Rw`, `f` -> `3Fw`, `M` -> `2L 2R'`); each was checked to have exactly the 3x3 effect on a reduced cube. The other 10 work as they are.
- **The two last-layer parity cases**: OLL parity (an odd number of yellow dedges on top, with two variants that each have their own card: 3 yellow dedges on top, fixed by flipping the one flipped dedge; and only 1 yellow dedge on top, fixed by holding it at the back, doing the OLL parity algorithm, a quarter turn of the top layer and the 3x3 line algorithm) and PLL parity (two opposite edges, two adjacent edges, two adjacent corners swapped, or any other odd arrangement such as all four edges in a cycle). Each card has a top-view diagram, how to recognize it in the 4-step flow of the Trainer, how to hold the cube, the algorithm and numbered steps with a small diagram after each one. The algorithms and steps were checked by running them on the engine (and, for the engine, against an independent simulator). A general rule covers every odd edge arrangement (parity algorithm once, a half turn, then the normal step 4); a diagonal corner swap with solved edges is not covered.
- **Careful with `r`**: many tutorials write `r`/`r2` for the inner slice only, but in this app (3x3 mode) a lowercase `r` means `Rw` (two layers). In the 4x4 section the inner slice is always written `2R` and wide moves `Rw`, never `r`.

## Profiles

Each person uses their own **profile** (for example, several people sharing one device). Each profile stores its own solves, timer settings, trainer progress (status and times of each case) and plan milestones.

- **Create**: *+ New profile* button in the header; it starts empty with default settings.
- **Switch**: *Profile* selector in the header (shows the name and how many solves it has). Switching repaints the whole app with that profile's data.
- **Rename / delete**: *Stats > Manage*. Deleting also removes the profile's solves and progress.

**Migration:** when upgrading from the sessions version, the settings, plan milestones and trainer progress that existed (which were global) are copied to all existing profiles (the old sessions). From then on each profile evolves separately. A profile created later starts from scratch. In the published version, synced data is converted automatically to the new format (one document per profile) after the first load; the old document is left untouched.

## Language

The app is in **English by default**. Use the **EN / ES** switch in the header to change to Spanish. The choice is remembered per browser and device (it is not part of your profile data and is not synced). The 3x3 / 4x4 mode works the same way. The `README.es.md` file is the Spanish version of this document.

## Where data is stored

In your browser's `localStorage`, under the key `cubotrainer.v1`. Nothing is sent to any server. Data is specific to each browser and each site: the online version, the local copy and another browser each keep their own data, and if you clear the site data you lose it. If the browser does not allow saving, the app works in memory and shows a warning message at the top.

## Backups

Make backups regularly from *Stats > JSON backup* and keep the file somewhere safe. You can restore it with *Import JSON*. **Import replaces all profiles** with the contents of the file, so export a backup first if you have data you want to keep.

## claude.ai Artifact version

The version published as a claude.ai Artifact (private, for personal use) syncs between the owner's devices through their Claude account. Each profile syncs separately (only what changed on that device is uploaded) and changes arrive live on the other device; the selected profile is per device and is not synced. The online and local versions keep their data separately, in the browser. To move data from one to the other: *Stats > JSON backup*, then *Import JSON* in the other.

Importing JSON in the Artifact replaces all profiles on every synced device, so export a backup first.

To regenerate the file to publish: `node tools/build-artifact.js` (creates `dist/index.html` and lists the `css/` and `js/` files to publish with the same paths).

## Tests

```
node tests/stats.test.js
node tests/storage.test.js
node tests/sync.test.js
node tests/verify-cube.js
node tests/i18n.test.js
node tests/content.test.js
node tests/notation.test.js
node tests/cube4.test.js
node tests/parity.test.js
node tests/edges4.test.js
node tests/notation4.test.js
node tests/plan4.test.js
node tests/puzzle.test.js
node tests/trainer4.test.js
```

## Structure

- `index.html`, `css/styles.css`, `css/notation.css`
- `js/i18n.js`: language handling (English default, Spanish) and UI texts.
- `js/puzzle.js`: the 3x3 / 4x4 mode (device preference, helpers to filter the solves of the puzzle in use).
- `js/cube.js`, `js/cube3d.js`, `js/algs.js`, `js/plan.js`, `js/plan4.js`: cube model, 3D cube drawing, algorithms and the 3x3 and 4x4 plan data (all bilingual).
- `js/notation.js`: the Notation tab (move diagrams computed from the cube engine; it shows the 4x4 section in 4x4 mode).
- `js/trainer4.js`: the 4x4 version of the Trainer cases (the 16 algorithms rewritten where needed, plus the parity cases).
- `js/cube4.js`, `js/parity4.js`, `js/edges4.js`, `js/notation4.js`: the 4x4 engine, the checked parity algorithms and recipes, the checked last-two-edges recipe (situations, recognition, setup) and the 4x4 section of the Notation tab.
- `js/storage.js`, `js/stats.js`, `js/timer.js`, `js/trainer.js`, `js/planview.js`, `js/app.js`: persistence, statistics, timer, trainer, plan view and startup.
