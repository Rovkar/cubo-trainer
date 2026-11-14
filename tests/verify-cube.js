'use strict';
const path = require('path');
const Cube = require(path.join(__dirname, '..', 'js', 'cube.js'));
const ALGS = require(path.join(__dirname, '..', 'js', 'algs.js'));

let passed = 0, failed = 0;
function check(cond, msg) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + msg); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const S = () => Cube.solved('wca');
const Y = () => Cube.solved('yellowTop');
const AUFS = ['', 'U', "U'", 'U2'];

// 1. Moves
const MOVES = 'U D L R F B M E S x y z u d l r f b'.split(' ');
MOVES.forEach((m) => {
  const s0 = S();
  check(eq(Cube.applyAlg(s0, m + ' ' + m + ' ' + m + ' ' + m), s0), m + 'x4 = id');
  check(eq(Cube.applyAlg(s0, m + " " + m + "'"), s0), m + " " + m + "' = id");
  check(eq(Cube.applyAlg(s0, m + '2'), Cube.applyAlg(s0, m + ' ' + m)), m + '2 = ' + m + ' ' + m);
  // y con un estado mezclado, para que no sean triviales
  const sc = Cube.applyAlg(s0, "R U F' L D2 B");
  check(eq(Cube.applyAlg(sc, m + ' ' + m + ' ' + m + ' ' + m), sc), m + 'x4 = id (mezclado)');
});

// 2. Direcciones
(function () {
  const all = (arr, c) => arr.every((x) => x === c);
  let s = Cube.applyAlg(S(), 'R');
  check(all([s.U[2], s.U[5], s.U[8]], 'g'), 'R: U derecha = g');
  s = Cube.applyAlg(S(), 'U');
  check(all(s.F.slice(0, 3), 'r'), 'U: F fila 0 = r');
  s = Cube.applyAlg(S(), 'F');
  check(all(s.U.slice(6, 9), 'o'), 'F: U fila 2 = o');
  s = Cube.applyAlg(S(), 'M');
  check(all([s.F[1], s.F[4], s.F[7]], 'w'), 'M: F columna central = w');
  s = Cube.applyAlg(S(), 'E');
  check(all(s.R.slice(3, 6), 'g'), 'E: R fila central = g');
  s = Cube.applyAlg(S(), 'S');
  check(all([s.R[1], s.R[4], s.R[7]], 'w'), 'S: R columna central = w');
  check(all(Cube.applyAlg(S(), 'x').U, 'g'), 'x: U = g');
  check(all(Cube.applyAlg(S(), 'y').F, 'r'), 'y: F = r');
  check(all(Cube.applyAlg(S(), 'z').U, 'o'), 'z: U = o');
})();

// 3. Identidades
const rep = (alg, n) => Array(n).fill(alg).join(' ');
const ID = {
  "(R U R' U')x6": rep("R U R' U'", 6),
  'Sune x6': rep("R U R' U R U2 R'", 6),
  'T-perm x2': rep("R U R' U' R' F R2 U' R' U' R U R' F'", 2),
  'Y-perm x2': rep("F R U' R' U' R U R' F' R U R' U' R' F R F'", 2),
  'Ua x3': rep("R U' R U R U R U' R' U' R2", 3),
  'H x2': rep('M2 U M2 U2 M2 U M2', 2),
};
Object.keys(ID).forEach((k) => check(Cube.isSolved(Cube.applyAlg(S(), ID[k])), k + ' = id'));
(function () {
  // Z lleva el AUF final (U') incluido para que sea una permutacion pura de aristas
  // y el diagrama del caso muestre las esquinas alineadas.
  const Z = "M' U M2 U M2 U M' U2 M2 U'";
  check(Cube.isSolved(Cube.applyAlg(Y(), Z + ' ' + Z)), "Z (con U' final) x2 = id");
  const zv = Cube.lastLayerView(Cube.applyAlg(Y(), Z), 'pll');
  check(['b', 'r', 'f', 'l'].every((k) => zv[k][0] === zv[k][2]), 'Z: esquinas alineadas en el caso');
})();

// 4. Algoritmos
const sideRows = (st) => ['F', 'R', 'B', 'L'].map((f) => st[f].slice(3));
ALGS.forEach((a) => {
  const id = a.id;
  const sol = Y();
  const after = Cube.applyAlg(sol, a.alg);
  check(eq(after.D, sol.D), id + ': D intacta');
  check(eq(sideRows(after), sideRows(sol)), id + ': filas 1-2 intactas');
  FACE_CENTERS: ['U', 'D', 'F', 'R', 'B', 'L'].forEach((f) => check(after[f][4] === sol[f][4], id + ': centro ' + f));

  const cs = Cube.applyAlg(sol, Cube.invertAlg(a.alg));
  const yEdges = [1, 3, 5, 7].filter((i) => cs.U[i] === 'y');
  const yCorners = [0, 2, 6, 8].filter((i) => cs.U[i] === 'y');
  const strip = ['F', 'R', 'B', 'L'].filter((f) => cs[f][0] === cs[f][1] && cs[f][1] === cs[f][2]);

  if (id === 'eo-line') {
    check(yEdges.length === 2 && yEdges[0] + yEdges[1] === 8, id + ': 2 aristas opuestas');
  } else if (id === 'eo-l') {
    check(yEdges.length === 2 && yEdges[0] + yEdges[1] !== 8, id + ': 2 aristas adyacentes');
  } else if (id === 'eo-dot') {
    check(yEdges.length === 0, id + ': 0 aristas');
  }
  if (a.set === 'OCLL') {
    check(yEdges.length === 4, id + ': 4 aristas amarillas');
    const exp = { 'ocll-sune': 1, 'ocll-antisune': 1, 'ocll-h': 0, 'ocll-pi': 0, 'ocll-u': 2, 'ocll-t': 2, 'ocll-l': 2 }[id];
    check(yCorners.length === exp, id + ': esquinas amarillas ' + yCorners.length + ' esperado ' + exp);
  }
  if (a.set === 'CP' || a.set === 'EP') check(cs.U.every((c) => c === 'y'), id + ': U toda amarilla');
  if (a.set === 'EP') {
    const k = AUFS.find((au) => {
      const t = Cube.applyAlg(cs, au);
      return ['F', 'R', 'B', 'L'].every((f) => t[f][0] === sol[f][0] && t[f][2] === sol[f][2]);
    });
    check(k !== undefined, id + ': esquinas bien salvo AUF');
    if (k !== undefined) {
      const t = Cube.applyAlg(cs, k);
      check(['F', 'R', 'B', 'L'].some((f) => t[f][1] !== sol[f][1]), id + ': aristas mal');
    }
    const want = id === 'ep-ua' || id === 'ep-ub' ? 1 : 0;
    // con esquinas alineadas (tras AUF) cuenta lados completos
    const t = Cube.applyAlg(cs, k || '');
    const full = ['F', 'R', 'B', 'L'].filter((f) => t[f][0] === t[f][1] && t[f][1] === t[f][2]).length;
    check(full === want, id + ': lados completos ' + full + ' esperado ' + want);
  }
  check(AUFS.some((au) => Cube.isSolved(Cube.applyAlg(Cube.applyAlg(cs, a.alg), au))), id + ': caso + alg (+AUF) resuelto');
  void strip;
});

// 5. Scrambles
(function () {
  const axisOf = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };
  let ok = true;
  for (let n = 0; n < 2000; n++) {
    const s = Cube.randomScramble(20);
    const t = s.split(' ');
    if (t.length !== 20) ok = false;
    t.forEach((x, i) => {
      if (!/^[UDLRFB](2|')?$/.test(x)) ok = false;
      if (i > 0 && x[0] === t[i - 1][0]) ok = false;
      if (i > 1 && axisOf[t[i - 1][0]] === axisOf[t[i - 2][0]] && axisOf[x[0]] === axisOf[t[i - 1][0]]) ok = false;
    });
    if (!ok) { console.log('mal scramble: ' + s); break; }
    if (!Cube.isSolved(Cube.applyAlg(Cube.applyAlg(S(), s), Cube.invertAlg(s)))) { ok = false; break; }
  }
  check(ok, '2000 scrambles validos y reversibles');
  check(Cube.randomScramble().split(' ').length === 20, 'longitud por defecto 20');
})();

// 6. parseAlg
(function () {
  check(eq(Cube.parseAlg("(R U R' U') R2' Rw"), ['R', 'U', "R'", "U'", 'R2', 'r']), 'parseAlg acepta parentesis, R2\' y Rw');
  let t1 = false, t2 = false;
  try { Cube.parseAlg('R3'); } catch (e) { t1 = true; }
  try { Cube.parseAlg('Q'); } catch (e) { t2 = true; }
  check(t1, 'rechaza R3');
  check(t2, 'rechaza Q');
  check(Cube.invertAlg("R U2 F'") === "F R2 U' R'".replace("R2 U' R'", "U2 R'"), 'invertAlg');
})();

console.log(passed + ' ok, ' + failed + ' fallos');
process.exit(failed ? 1 : 0);
