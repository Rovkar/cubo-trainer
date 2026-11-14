(function (root) {
  'use strict';
  // Names, set names and tips are bilingual ({en, es}); the name/setName/tip getters follow the current language.
  const S = {
    EO: ['EO', { en: '1 · Yellow cross', es: '1 · Cruz amarilla' }, 'eo'],
    OCLL: ['OCLL', { en: '2 · Orient corners', es: '2 · Orientar esquinas' }, 'oll'],
    CP: ['CP', { en: '3 · Permute corners', es: '3 · Permutar esquinas' }, 'cp'],
    EP: ['EP', { en: '4 · Permute edges', es: '4 · Permutar aristas' }, 'pll'],
  };
  function lang(obj) {
    const I = root.I18N;
    if (I && I.pick) return I.pick(obj);
    return obj.en;
  }
  function a(id, set, name, alg, tip) {
    const o = { id: id, set: S[set][0], alg: alg, mask: S[set][2] };
    o.i18n = { name: name, setName: S[set][1], tip: tip };
    Object.defineProperty(o, 'setName', { enumerable: true, get: function () { return lang(o.i18n.setName); } });
    Object.defineProperty(o, 'name', { enumerable: true, get: function () { return lang(o.i18n.name); } });
    Object.defineProperty(o, 'tip', { enumerable: true, get: function () { return lang(o.i18n.tip); } });
    return o;
  }
  const ALGS = [
    a('eo-line', 'EO', { en: 'Line', es: 'Línea' }, "F R U R' U' F'", {
      en: "Horizontal line: the yellow edges on top are on the left and right (the back and front ones show their yellow on the side). Hold the cube with the line running left to right.",
      es: "Línea horizontal: las aristas amarillas de arriba están a izquierda y derecha (las de atrás y delante muestran el amarillo de lado). Sostén el cubo con la línea de izquierda a derecha.",
    }),
    a('eo-l', 'EO', { en: 'L shape', es: 'Forma de L' }, "f R U R' U' f'", {
      en: "L shape: the two yellow edges on top are on the right and in front (the L points toward you and to the right). Turn the top layer until the L is in that position.",
      es: "Forma de L: las dos aristas amarillas de arriba están a la derecha y delante (la L apunta hacia ti y a la derecha). Gira la capa de arriba hasta tener la L en esa posición.",
    }),
    a('eo-dot', 'EO', { en: 'Dot', es: 'Punto' }, "F R U R' U' F' f R U R' U' f'", {
      en: "Dot: only the center is yellow on top, no edges. It doesn't matter how you hold it; all four edges show their yellow on the side.",
      es: "Punto: solo el centro es amarillo arriba, ninguna arista. No importa cómo lo sostengas; las cuatro aristas muestran el amarillo de lado.",
    }),
    a('ocll-sune', 'OCLL', { en: 'Sune', es: 'Sune' }, "R U R' U R U2 R'", {
      en: "Sune: there is only one corner with yellow on top and it must end up at the bottom left (close to you). Turn the top layer until it is placed like that.",
      es: "Sune: hay una sola esquina con amarillo arriba y debe quedar abajo a la izquierda (cerca de ti). Gira la capa de arriba hasta colocarla así.",
    }),
    a('ocll-antisune', 'OCLL', { en: 'Antisune', es: 'Antisune' }, "R U2 R' U' R U' R'", {
      en: "Antisune: only one corner with yellow on top and it must end up at the top right (away from you), with the cross already done. It is the inverse of the Sune.",
      es: "Antisune: una sola esquina con amarillo arriba y debe quedar arriba a la derecha (lejos de ti), con la cruz ya hecha. Es el inverso del Sune.",
    }),
    a('ocll-h', 'OCLL', { en: 'H', es: 'H' }, "R U R' U R U' R' U R U2 R'", {
      en: "H: no yellow corners on top; the yellows of all four corners face left and right (two on each side). Hold the cube like that.",
      es: "H: ninguna esquina amarilla arriba; los amarillos de las cuatro esquinas miran a izquierda y derecha (dos de cada lado). Sostén el cubo así.",
    }),
    a('ocll-pi', 'OCLL', { en: 'Pi', es: 'Pi' }, "R U2 R2 U' R2 U' R2 U2 R", {
      en: "Pi: no yellow corners on top; on the left there are two yellows on the side (one per corner) and on the right one faces you and another faces the back.",
      es: "Pi: ninguna esquina amarilla arriba; a la izquierda hay dos amarillos de lado (uno por esquina) y a la derecha uno mira hacia ti y otro hacia atrás.",
    }),
    a('ocll-u', 'OCLL', { en: 'U (headlights)', es: 'U (faros)' }, "R2 D R' U2 R D' R' U2 R'", {
      en: "U (headlights): two yellow corners on top, the back ones; the two front ones show their yellow toward you (yellow headlights in front).",
      es: "U (faros): dos esquinas amarillas arriba, las de atrás; las dos de delante muestran el amarillo hacia ti (faros amarillos al frente).",
    }),
    a('ocll-t', 'OCLL', { en: 'T', es: 'T' }, "r U R' U' r' F R F'", {
      en: "T: two yellow corners on top, the ones on the right side; on the left the yellows of the other two corners face toward you and toward the back.",
      es: "T: dos esquinas amarillas arriba, las del lado derecho; a la izquierda los amarillos de las otras dos esquinas miran hacia ti y hacia atrás.",
    }),
    a('ocll-l', 'OCLL', { en: 'L (bowtie)', es: 'L (pajarita)' }, "F' r U R' U' r' F R", {
      en: "L (bowtie): two yellow corners on top, diagonal (top right and bottom left); the back-left one faces left and the front-right one faces toward you.",
      es: "L (pajarita): dos esquinas amarillas arriba en diagonal (arriba a la derecha y abajo a la izquierda); la de atrás-izquierda mira a la izquierda y la de delante-derecha mira hacia ti.",
    }),
    a('cp-adj', 'CP', { en: 'Headlights · T-perm', es: 'Faros · T-perm' }, "R U R' U' R' F R2 U' R' U' R U R' F'", {
      en: "Headlights (two corners of the same color) on the left face; hold the cube with the headlights on the left. If you don't see headlights on any side, it is the diagonal case.",
      es: "Faros (dos esquinas del mismo color) en la cara izquierda; sostén el cubo con los faros a la izquierda. Si no ves faros en ningún lado, es el caso diagonal.",
    }),
    a('cp-diag', 'CP', { en: 'Diagonal · Y-perm', es: 'Diagonal · Y-perm' }, "F R U' R' U' R U R' F' R U R' U' R' F R F'", {
      en: "Diagonal: no face has two corners of the same color (no headlights on any side). If you see headlights on any side, it is the headlights case (T-perm).",
      es: "Diagonal: ninguna cara tiene dos esquinas del mismo color (sin faros en ningún lado). Si ves faros en algún lado, es el caso de faros (T-perm).",
    }),
    a('ep-ua', 'EP', { en: 'Ua', es: 'Ua' }, "R U' R U R U R U' R' U' R2", {
      en: "Ua: solved side at the back (stripe all blue). On the front face the middle edge is orange (on the left it is green and on the right red).",
      es: "Ua: lado resuelto atrás (franja toda azul). En la cara de delante la arista del medio es naranja (a la izquierda es verde y a la derecha roja).",
    }),
    a('ep-ub', 'EP', { en: 'Ub', es: 'Ub' }, "R2 U R U R' U' R' U' R' U R'", {
      en: "Ub: solved side at the back (stripe all blue). On the front face the middle edge is red (on the left it is orange and on the right green).",
      es: "Ub: lado resuelto atrás (franja toda azul). En la cara de delante la arista del medio es roja (a la izquierda es naranja y a la derecha verde).",
    }),
    a('ep-h', 'EP', { en: 'H', es: 'H' }, "M2 U M2 U2 M2 U M2", {
      en: "H: no side solved; the edges are swapped with the opposite one (front with back and left with right), so each stripe has the edge of the opposite color.",
      es: "H: ningún lado resuelto; las aristas están intercambiadas con la opuesta (delante con atrás y izquierda con derecha), así que cada franja tiene la arista del color contrario.",
    }),
    a('ep-z', 'EP', { en: 'Z', es: 'Z' }, "M' U M2 U M2 U M' U2 M2 U'", {
      en: "Z: no side solved; the edges swap between neighboring sides (back with right and front with left). Hold the cube with a back-right swap.",
      es: "Z: ningún lado resuelto; las aristas se intercambian entre lados vecinos (atrás con derecha y delante con izquierda). Sostén el cubo con un intercambio atrás-derecha.",
    }),
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = ALGS;
  else root.ALGS = ALGS;
})(typeof window !== 'undefined' ? window : globalThis);
