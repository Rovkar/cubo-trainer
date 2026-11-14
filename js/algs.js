(function (root) {
  'use strict';
  const S = {
    EO: ['EO', '1 · Cruz amarilla', 'eo'],
    OCLL: ['OCLL', '2 · Orientar esquinas', 'oll'],
    CP: ['CP', '3 · Permutar esquinas', 'cp'],
    EP: ['EP', '4 · Permutar aristas', 'pll'],
  };
  function a(id, set, name, alg, tip) {
    return { id: id, set: S[set][0], setName: S[set][1], name: name, alg: alg, mask: S[set][2], tip: tip };
  }
  const ALGS = [
    a('eo-line', 'EO', 'Línea', "F R U R' U' F'", "Línea horizontal: las aristas amarillas de arriba están a izquierda y derecha (las de atrás y delante muestran el amarillo de lado). Sostén el cubo con la línea de izquierda a derecha."),
    a('eo-l', 'EO', 'Forma de L', "f R U R' U' f'", "Forma de L: las dos aristas amarillas de arriba están a la derecha y delante (la L apunta hacia ti y a la derecha). Gira la capa de arriba hasta tener la L en esa posición."),
    a('eo-dot', 'EO', 'Punto', "F R U R' U' F' f R U R' U' f'", "Punto: solo el centro es amarillo arriba, ninguna arista. No importa cómo lo sostengas; las cuatro aristas muestran el amarillo de lado."),
    a('ocll-sune', 'OCLL', 'Sune', "R U R' U R U2 R'", "Sune: hay una sola esquina con amarillo arriba y debe quedar abajo a la izquierda (cerca de ti). Gira la capa de arriba hasta colocarla así."),
    a('ocll-antisune', 'OCLL', 'Antisune', "R U2 R' U' R U' R'", "Antisune: una sola esquina con amarillo arriba y debe quedar arriba a la derecha (lejos de ti), con la cruz ya hecha. Es el inverso del Sune."),
    a('ocll-h', 'OCLL', 'H', "R U R' U R U' R' U R U2 R'", "H: ninguna esquina amarilla arriba; los amarillos de las cuatro esquinas miran a izquierda y derecha (dos de cada lado). Sostén el cubo así."),
    a('ocll-pi', 'OCLL', 'Pi', "R U2 R2 U' R2 U' R2 U2 R", "Pi: ninguna esquina amarilla arriba; a la izquierda hay dos amarillos de lado (uno por esquina) y a la derecha uno mira hacia ti y otro hacia atrás."),
    a('ocll-u', 'OCLL', 'U (faros)', "R2 D R' U2 R D' R' U2 R'", "U (faros): dos esquinas amarillas arriba, las de atrás; las dos de delante muestran el amarillo hacia ti (faros amarillos al frente)."),
    a('ocll-t', 'OCLL', 'T', "r U R' U' r' F R F'", "T: dos esquinas amarillas arriba, las del lado derecho; a la izquierda los amarillos de las otras dos esquinas miran hacia ti y hacia atrás."),
    a('ocll-l', 'OCLL', 'L (pajarita)', "F' r U R' U' r' F R", "L (pajarita): dos esquinas amarillas arriba en diagonal (arriba a la derecha y abajo a la izquierda); la de atrás-izquierda mira a la izquierda y la de delante-derecha mira hacia ti."),
    a('cp-adj', 'CP', 'Faros · T-perm', "R U R' U' R' F R2 U' R' U' R U R' F'", "Faros (dos esquinas del mismo color) en la cara izquierda; sostén el cubo con los faros a la izquierda. Si no ves faros en ningún lado, es el caso diagonal."),
    a('cp-diag', 'CP', 'Diagonal · Y-perm', "F R U' R' U' R U R' F' R U R' U' R' F R F'", "Diagonal: ninguna cara tiene dos esquinas del mismo color (sin faros en ningún lado). Si ves faros en algún lado, es el caso de faros (T-perm)."),
    a('ep-ua', 'EP', 'Ua', "R U' R U R U R U' R' U' R2", "Ua: lado resuelto atrás (franja toda azul). En la cara de delante la arista del medio es naranja (a la izquierda es verde y a la derecha roja)."),
    a('ep-ub', 'EP', 'Ub', "R2 U R U R' U' R' U' R' U R'", "Ub: lado resuelto atrás (franja toda azul). En la cara de delante la arista del medio es roja (a la izquierda es naranja y a la derecha verde)."),
    a('ep-h', 'EP', 'H', "M2 U M2 U2 M2 U M2", "H: ningún lado resuelto; las aristas están intercambiadas con la opuesta (delante con atrás y izquierda con derecha), así que cada franja tiene la arista del color contrario."),
    a('ep-z', 'EP', 'Z', "M' U M2 U M2 U M' U2 M2 U'", "Z: ningún lado resuelto; las aristas se intercambian entre lados vecinos (atrás con derecha y delante con izquierda). Sostén el cubo con un intercambio atrás-derecha."),
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = ALGS;
  else root.ALGS = ALGS;
})(typeof window !== 'undefined' ? window : globalThis);
