# Cubo Trainer

**Español** · [English](README.md)

App web para mejorar tus tiempos en el cubo 3x3 (método por capas) y para aprender a resolver un 4x4 por reducción: cronómetro con mezclas, cronometraje por fases, estadísticas, entrenador de algoritmos de última capa, plan de entrenamiento y una referencia de la notación de movimientos. Un selector **3x3 / 4x4** en la cabecera cambia toda la app entre los dos cubos. No necesita instalación, cuenta ni servidor propio.

**Úsala en línea:** https://rovkar.github.io/cubo-trainer/

## Cómo abrirla

- **En línea:** abre el enlace de arriba en el móvil o en el ordenador. No hace falta registrarse.
- **Sin internet:** descarga el repositorio y haz doble clic en `index.html`. Funciona directamente desde el disco (`file://`) en cualquier navegador moderno.

## Controles del cronómetro

- **Espacio** (o **tocar la zona del cronómetro** en móvil): mantén pulsado unos 0,3 s hasta que se ponga en verde y suelta para empezar. Si sueltas antes (ámbar), no arranca.
- **Cualquier tecla / toque** mientras corre: para el cronómetro.
- **Modo fases**: cada pulsación registra el final de una fase; la última pulsación detiene el cronómetro (N fases = N pulsaciones).
- **Inspección de 15 s** (opcional): la primera pulsación inicia la cuenta atrás, con avisos a los 8 s y 12 s. Si empiezas entre 15 y 17 s se añade +2; pasados 17 s es DNF. **Escape** cancela la inspección.
- Los atajos se ignoran si escribes en un campo de texto o hay una ventana emergente abierta.

## Modo 3x3 / 4x4

Junto al título *Cubo Trainer* hay un selector **3x3 / 4x4**. Cambia toda la app, no solo una pestaña. Todo lo que depende del cubo se guarda por separado para cada uno:

- **Cronómetro**: mezclas del cubo en uso (las del 4x4 usan `U D L R F B` y los movimientos anchos `Uw`, `Rw`, `Fw`; 40 movimientos por defecto, de 30 a 60 en los ajustes) y los presets de fases del cubo (en el 4x4: reducción, *Centros · Aristas · Etapa 3x3*, y uno detallado, *Centros · Aristas · Cruz · F2L · Última capa*). Cada resolución nueva se guarda con el cubo para el que fue.
- **Estadísticas**: resoluciones, numeración, estadísticas rápidas, la lista, ao5/ao12/ao50/ao100, el gráfico, el análisis por fases y la exportación CSV solo cuentan las resoluciones del cubo en uso. Las resoluciones guardadas antes de que existiera el selector son de 3x3.
- **Entrenador**: el modo 4x4 muestra los mismos 16 casos de última capa con sus versiones de 4x4 (seis se reescriben, ver abajo). Su estado y sus tiempos son independientes de los del 3x3.
- **Plan**: el modo 4x4 muestra un plan corto de 4x4 (diagnóstico, centros, emparejar aristas, última capa y paridades, lookahead) para quien ya resuelve el 3x3 con 4LLL. Sus metas son habilidades, no tiempos, y sus hitos son independientes de los del plan de 3x3. La tarjeta de situación dice para qué cubo es y usa el ao12 de ese cubo.
- **Notación**: la referencia de movimientos del 3x3 o del 4x4, según el modo.

El modo es una preferencia del dispositivo, como el idioma: se recuerda en este navegador (`cubotrainer.ntSize`), no forma parte de los datos del perfil y no se sincroniza. Los perfiles son los mismos para los dos cubos (el selector de perfil cuenta las resoluciones del cubo en uso).

## Pestañas

- **Cronómetro**: mezcla (con vista en red), cronómetro, ajustes (inspección, modo fases, ocultar tiempo, longitud de mezcla, mostrar red), estadísticas rápidas y últimas 10 resoluciones con OK / +2 / DNF / borrar. Haz clic en un tiempo para ver la mezcla, la fecha y los tiempos por fase.
- **Entrenador**: *Aprender* muestra los 16 casos de última capa con diagrama, algoritmo, consejo y estado (Nuevo / Aprendiendo / Dominado). *Practicar* te propone casos aleatorios (más a menudo los que estás aprendiendo y los más lentos): te da el setup, cronometras la ejecución y luego se revela la solución. Tras parar, Espacio pasa al siguiente caso.
- **Estadísticas**: single, ao5, ao12, ao50 y ao100 (actual y mejor), gráfico de evolución con la meta de tu fase actual, análisis de en qué fase pierdes más tiempo, tabla completa de resoluciones y gestión del perfil (renombrar, borrar, exportar CSV, copia de seguridad JSON, importar JSON).
- **Plan**: plan de entrenamiento por fases con hitos que puedes marcar, tu situación actual según tu ao12 (los hitos son de cada perfil), rutina diaria y consejos.
- **Notación**: en modo 3x3, un diagrama por cada letra de movimiento (U D R L F B, cada una con `'` y `2`, más `r`, `f` y `M`, que usa el Entrenador), calculado con el motor del cubo. Cada uno incluye una descripción física del giro y una comprobación de *resultado sobre un cubo resuelto*. En modo 4x4 muestra la sección de 4x4, descrita abajo.

## Sección 4x4

Para resolver un 4x4 por reducción (centros, emparejar aristas y luego los pasos del 3x3; seis de los 16 algoritmos del Entrenador se reescriben para un 4x4, ver abajo). Cambia a **4x4** en la cabecera y abre la pestaña **Notación**. Incluye:

- **Notación de 4x4**: caras exteriores (`U D R L F B`; D, L y B llevan la misma explicación de «parece al revés» que la pestaña del 3x3), capa interior (`2R`), movimientos anchos (`Rw`, `Uw`, `Fw`: los que usan las mezclas), movimiento ancho de tres capas (`3Rw`, `3Fw`) y rotaciones del cubo entero (`x`, `y`), cada una con un diagrama antes/después cuyas flechas se calculan con el motor del 4x4.
- **Las dos últimas aristas (emparejar aristas)**: cuando solo quedan dos aristas por emparejar, los movimientos de capa no pueden unirlas. La tarjeta (antes de las de paridad, porque es de la etapa de reducción) explica cuándo la necesitas, cómo sostener el cubo y llevar las dos aristas sin emparejar a las aristas verticales izquierda y derecha de la cara frontal usando solo giros de cara exterior (una tabla por sitio), y cómo reconocer el caso con las cuatro piezas del frente. Caso 1 (las mitades que van juntas, lado a lado): `Dw R F' U R' F Dw'`. Caso 2 (cruzadas): primero `R F' U R' F` y luego el algoritmo del caso 1. Cada uno tiene pasos numerados con un diagrama de frente después de cada paso. La receta se comprobó con las 16 disposiciones posibles de las dos aristas (cada una construida desde un cubo resuelto), desde los dos agarres que permite, y empareja las dos aristas con los centros resueltos y las otras diez parejas intactas; también se comprobó en cubos aleatorios con otras aristas, con un argumento de permutación fija que cubre cualquier otro cubo y contra el simulador independiente. *No* es paridad (la paridad aparece después, en la última capa).
- **Algoritmos del Entrenador en un 4x4**: los del Entrenador con `r`, `f` o `M` (T y L de orientar esquinas, forma de L y punto de la cruz, H y Z) no funcionan tal cual en un 4x4: desemparejan aristas o usan un movimiento que no existe. La página lista sus versiones de 4x4 (`r` -> `3Rw`, `f` -> `3Fw`, `M` -> `2L 2R'`); de cada una se comprobó que tiene exactamente el efecto del 3x3 en un cubo reducido. Los otros 10 funcionan tal cual.
- **Los dos casos de paridad de la última capa**: paridad de OLL (un número impar, 1 o 3, de aristas dobles volteadas) y paridad de PLL (dos aristas opuestas, dos aristas vecinas, dos esquinas vecinas intercambiadas, o cualquier otra disposición impar, como las cuatro aristas en un ciclo). Cada tarjeta tiene un diagrama desde arriba, cómo reconocerlo en los 4 pasos del Entrenador, cómo sostener el cubo, el algoritmo y pasos numerados con un diagrama pequeño después de cada uno. Los algoritmos y los pasos se comprobaron ejecutándolos en el motor (y el motor, contra un simulador independiente). Una regla general cubre toda disposición impar de aristas (algoritmo de paridad una vez, media vuelta y luego el paso 4 normal); un intercambio en diagonal de dos esquinas con las aristas resueltas no está cubierto.
- **Cuidado con la `r`**: muchos tutoriales escriben `r`/`r2` para la capa interior sola, pero en esta app (modo 3x3) una `r` minúscula significa `Rw` (dos capas). En la sección de 4x4 la capa interior se escribe siempre `2R` y los movimientos anchos `Rw`, nunca `r`.

## Perfiles

Cada persona usa su propio **perfil** (por ejemplo, varias personas que comparten un dispositivo). Cada perfil guarda por separado sus resoluciones, sus ajustes del cronómetro, el progreso del entrenador (estado y tiempos de cada caso) y los hitos del plan.

- **Crear**: botón *+ Nuevo perfil* en la cabecera; empieza vacío y con los ajustes por defecto.
- **Cambiar**: selector *Perfil* de la cabecera (muestra el nombre y cuántas resoluciones tiene). Al cambiar se repinta toda la app con los datos de ese perfil.
- **Renombrar / borrar**: *Estadísticas > Gestión*. Borrar elimina también las resoluciones y el progreso del perfil.

**Migración:** al actualizar desde la versión con sesiones, los ajustes, los hitos del plan y el progreso del entrenador que había (que eran globales) se copian a todos los perfiles existentes (las antiguas sesiones). A partir de ahí cada perfil evoluciona por separado. Un perfil creado después empieza de cero. En la versión publicada, los datos sincronizados se convierten solos al nuevo formato (un documento por perfil) tras la primera carga; el documento antiguo no se toca.

## Idioma

La app está en **inglés por defecto**. Usa el selector **EN / ES** de la cabecera para cambiar a español. La elección se recuerda en cada navegador y dispositivo (no forma parte de los datos del perfil y no se sincroniza). El modo 3x3 / 4x4 funciona igual. El archivo `README.md` es la versión en inglés de este documento.

## Dónde se guardan los datos

En el `localStorage` de tu navegador, bajo la clave `cubotrainer.v1`. Nada se envía a ningún servidor. Los datos son específicos de cada navegador y de cada sitio: la versión en línea, la copia local y otro navegador guardan cada una sus propios datos, y si borras los datos del sitio los pierdes. Si el navegador no permite guardar, la app funciona en memoria y te avisa con un mensaje en la parte superior.

## Copias de seguridad

Haz copias de seguridad con regularidad desde *Estadísticas > Copia de seguridad JSON* y guarda el archivo en un lugar seguro. Puedes restaurarlo con *Importar JSON*. **Importar reemplaza todos los perfiles** por el contenido del archivo, así que exporta antes una copia si tienes datos que quieras conservar.

## Versión como Artifact de claude.ai

La versión publicada como Artifact de claude.ai (privada, para uso personal) se sincroniza entre los dispositivos de su propietario con su cuenta de Claude. Cada perfil se sincroniza por separado (solo se sube lo que cambió en ese dispositivo) y los cambios llegan en vivo al otro dispositivo; el perfil seleccionado es de cada dispositivo y no se sincroniza. La versión en línea y la local guardan sus datos aparte, en el navegador. Para pasar datos de una a otra: *Estadísticas > Copia de seguridad JSON* y luego *Importar JSON* en la otra.

Importar JSON en el Artifact reemplaza todos los perfiles en todos los dispositivos sincronizados, así que exporta antes una copia de seguridad.

Para regenerar el archivo a publicar: `node tools/build-artifact.js` (crea `dist/index.html` y lista los archivos `css/` y `js/` que hay que publicar con las mismas rutas).

## Pruebas

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

## Estructura

- `index.html`, `css/styles.css`, `css/notation.css`
- `js/i18n.js`: gestión del idioma (inglés por defecto, español) y textos de la interfaz.
- `js/puzzle.js`: el modo 3x3 / 4x4 (preferencia del dispositivo, utilidades para filtrar las resoluciones del cubo en uso).
- `js/cube.js`, `js/cube3d.js`, `js/algs.js`, `js/plan.js`, `js/plan4.js`: modelo del cubo, dibujo del cubo en 3D, algoritmos y datos de los planes de 3x3 y de 4x4 (todos bilingües).
- `js/notation.js`: la pestaña Notación (diagramas de movimientos calculados con el motor del cubo; en modo 4x4 muestra la sección de 4x4).
- `js/trainer4.js`: la versión de 4x4 de los casos del Entrenador (los 16 algoritmos reescritos donde hace falta, más los casos de paridad).
- `js/cube4.js`, `js/parity4.js`, `js/edges4.js`, `js/notation4.js`: el motor del 4x4, los algoritmos y recetas de paridad comprobados, la receta comprobada de las dos últimas aristas (situaciones, reconocimiento, preparación) y la sección de 4x4 de la pestaña Notación.
- `js/storage.js`, `js/stats.js`, `js/timer.js`, `js/trainer.js`, `js/planview.js`, `js/app.js`: persistencia, estadísticas, cronómetro, entrenador, vista del plan y arranque.
