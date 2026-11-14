const S = require('../js/stats.js');
let fails = 0;
function eq(a, b, msg) { if (a !== b && !(Math.abs(a - b) < 1e-6)) { fails++; console.error('FALLA: ' + msg + ' -> ' + a + ' != ' + b); } else console.log('ok  ' + msg); }
const s = (x) => x * 1000;
eq(S.averageOf([10,11,12,13,14].map(s), 5), s(12), 'ao5 normal');
eq(S.averageOf([Infinity,11,12,13,14].map((v) => v === Infinity ? v : s(v)), 5), s(13), 'ao5 con un DNF');
eq(S.averageOf([Infinity,Infinity,12,13,14].map((v) => v === Infinity ? v : s(v)), 5), Infinity, 'ao5 con dos DNF');
eq(S.averageOf([1,2], 5), null, 'ao5 insuficiente');
eq(S.effectiveTime({ time: 10000, penalty: '+2' }), 12000, '+2 aplicado');
eq(S.effectiveTime({ time: 10000, penalty: 'DNF' }), Infinity, 'DNF');
// ao12: 1..12 s -> recorta 1 y 12 -> media 2..11 = 6.5
eq(S.averageOf([1,2,3,4,5,6,7,8,9,10,11,12].map(s), 12), s(6.5), 'ao12 recorte 1');
// ao50: valores 1..50 -> recorta 3 por lado -> media 4..47 = 25.5
const a50 = Array.from({ length: 50 }, (_, i) => s(i + 1));
eq(S.averageOf(a50, 50), s(25.5), 'ao50 recorte 3');
const a100 = Array.from({ length: 100 }, (_, i) => s(i + 1));
eq(S.averageOf(a100, 100), s(50.5), 'ao100 recorte 5');
eq(S.formatTime(9870), '9.87', 'format 9.87');
eq(S.formatTime(12340), '12.34', 'format 12.34');
eq(S.formatTime(65210) === '1:05.21' ? 1 : 0, 1, 'format 1:05.21');
eq(S.formatTime(Infinity) === 'DNF' ? 1 : 0, 1, 'format DNF');
eq(S.formatTime(null) === '–' ? 1 : 0, 1, 'format null');
eq(S.formatTime(60000) === '1:00.00' ? 1 : 0, 1, 'format 1:00.00');
eq(S.rollingAverage([1,2,3,4,5].map(s), 5)[4], s(3), 'rolling ao5');
eq(S.rollingAverage([1,2,3,4,5].map(s), 5)[3], null, 'rolling null');
eq(S.bestSingle([s(5), Infinity, s(3)]), s(3), 'bestSingle');
eq(S.mean([s(2), Infinity, s(4)]), s(3), 'mean sin DNF');
const P = ['A', 'B', 'C'];
const solves = [
  { penalty: null, splits: [1000, 3000, 6000], phases: P },
  { penalty: null, splits: [3000, 5000, 10000], phases: P },
  { penalty: 'DNF', splits: [1, 2, 3], phases: P },
  { penalty: null, splits: null, phases: null },
];
const pb = S.phaseBreakdown(solves);
eq(pb.count, 2, 'phaseBreakdown count');
eq(pb.phases[0].avgMs, 2000, 'phase A avg');
eq(pb.phases[1].avgMs, 2000, 'phase B avg');
eq(pb.phases[2].avgMs, 4000, 'phase C avg');
eq(pb.phases[2].pct, 50, 'phase C pct');
if (fails) { console.error(fails + ' pruebas fallaron'); process.exit(1); }
console.log('Todas las pruebas pasaron');
