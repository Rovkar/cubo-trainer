# Cubo Trainer

**Español** · [English](README.md)

App web para mejorar tus tiempos en el cubo 3x3 (método por capas): cronómetro con mezclas, cronometraje por fases, estadísticas, entrenador de algoritmos de última capa, plan de entrenamiento y una referencia de la notación de movimientos. No necesita instalación, cuenta ni servidor propio.

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

## Pestañas

- **Cronómetro**: mezcla (con vista en red), cronómetro, ajustes (inspección, modo fases, ocultar tiempo, longitud de mezcla, mostrar red), estadísticas rápidas y últimas 10 resoluciones con OK / +2 / DNF / borrar. Haz clic en un tiempo para ver la mezcla, la fecha y los tiempos por fase.
- **Entrenador**: *Aprender* muestra los 16 casos de última capa con diagrama, algoritmo, consejo y estado (Nuevo / Aprendiendo / Dominado). *Practicar* te propone casos aleatorios (más a menudo los que estás aprendiendo y los más lentos): te da el setup, cronometras la ejecución y luego se revela la solución. Tras parar, Espacio pasa al siguiente caso.
- **Estadísticas**: single, ao5, ao12, ao50 y ao100 (actual y mejor), gráfico de evolución con la meta de tu fase actual, análisis de en qué fase pierdes más tiempo, tabla completa de resoluciones y gestión del perfil (renombrar, borrar, exportar CSV, copia de seguridad JSON, importar JSON).
- **Plan**: plan de entrenamiento por fases con hitos que puedes marcar, tu situación actual según tu ao12 (los hitos son de cada perfil), rutina diaria y consejos.
- **Notación**: un diagrama por cada letra de movimiento (U D R L F B, cada una con `'` y `2`, más `r`, `f` y `M`, que usa el Entrenador), calculado con el motor del cubo. Cada uno incluye una descripción física del giro y una comprobación de *resultado sobre un cubo resuelto*. Un selector **3x3 / 4x4** arriba (se recuerda por dispositivo) abre la sección de 4x4, descrita abajo.

## Sección 4x4

Para resolver un 4x4 por reducción (centros, emparejar aristas y luego los pasos del 3x3; seis de los 16 algoritmos del Entrenador se reescriben para un 4x4, ver abajo). Se abre en **Notación > 4x4** o con el botón *¿Resuelves un 4x4?* al final de **Entrenador > Aprender**. Incluye:

- **Notación de 4x4**: cara exterior (`R`), capa interior (`2R`), movimiento ancho (`Rw`), movimiento ancho de tres capas (`3Rw`, `3Fw`) y rotaciones del cubo entero (`x`, `y`), cada una con un diagrama antes/después cuyas flechas se calculan con el motor del 4x4.
- **Algoritmos del Entrenador en un 4x4**: los del Entrenador con `r`, `f` o `M` (T y L de orientar esquinas, forma de L y punto de la cruz, H y Z) no funcionan tal cual en un 4x4: desemparejan aristas o usan un movimiento que no existe. La página lista sus versiones de 4x4 (`r` -> `3Rw`, `f` -> `3Fw`, `M` -> `2L 2R'`); de cada una se comprobó que tiene exactamente el efecto del 3x3 en un cubo reducido. Los otros 10 funcionan tal cual.
- **Los dos casos de paridad de la última capa**: paridad de OLL (un número impar, 1 o 3, de aristas dobles volteadas) y paridad de PLL (dos aristas opuestas, dos aristas vecinas, dos esquinas vecinas intercambiadas, o cualquier otra disposición impar, como las cuatro aristas en un ciclo). Cada tarjeta tiene un diagrama desde arriba, cómo reconocerlo en los 4 pasos del Entrenador, cómo sostener el cubo, el algoritmo y pasos numerados con un diagrama pequeño después de cada uno. Los algoritmos y los pasos se comprobaron ejecutándolos en el motor (y el motor, contra un simulador independiente). Una regla general cubre toda disposición impar de aristas (algoritmo de paridad una vez, media vuelta y luego el paso 4 normal); un intercambio en diagonal de dos esquinas con las aristas resueltas no está cubierto.
- **Cuidado con la `r`**: muchos tutoriales escriben `r`/`r2` para la capa interior sola, pero en esta app (pestaña Notación, 3x3) una `r` minúscula significa `Rw` (dos capas). En la sección de 4x4 la capa interior se escribe siempre `2R` y los movimientos anchos `Rw`, nunca `r`.

## Perfiles

Cada persona usa su propio **perfil** (por ejemplo, varias personas que comparten un dispositivo). Cada perfil guarda por separado sus resoluciones, sus ajustes del cronómetro, el progreso del entrenador (estado y tiempos de cada caso) y los hitos del plan.

- **Crear**: botón *+ Nuevo perfil* en la cabecera; empieza vacío y con los ajustes por defecto.
- **Cambiar**: selector *Perfil* de la cabecera (muestra el nombre y cuántas resoluciones tiene). Al cambiar se repinta toda la app con los datos de ese perfil.
- **Renombrar / borrar**: *Estadísticas > Gestión*. Borrar elimina también las resoluciones y el progreso del perfil.

**Migración:** al actualizar desde la versión con sesiones, los ajustes, los hitos del plan y el progreso del entrenador que había (que eran globales) se copian a todos los perfiles existentes (las antiguas sesiones). A partir de ahí cada perfil evoluciona por separado. Un perfil creado después empieza de cero. En la versión publicada, los datos sincronizados se convierten solos al nuevo formato (un documento por perfil) tras la primera carga; el documento antiguo no se toca.

## Idioma

La app está en **inglés por defecto**. Usa el selector **EN / ES** de la cabecera para cambiar a español. La elección se recuerda en cada navegador y dispositivo (no forma parte de los datos del perfil y no se sincroniza). El archivo `README.md` es la versión en inglés de este documento.

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
node tests/notation4.test.js
```

## Estructura

- `index.html`, `css/styles.css`, `css/notation.css`
- `js/i18n.js`: gestión del idioma (inglés por defecto, español) y textos de la interfaz.
- `js/cube.js`, `js/cube3d.js`, `js/algs.js`, `js/plan.js`: modelo del cubo, dibujo del cubo en 3D, algoritmos y datos del plan (ambos bilingües).
- `js/notation.js`: la pestaña Notación (diagramas de movimientos calculados con el motor del cubo, selector 3x3 / 4x4).
- `js/cube4.js`, `js/parity4.js`, `js/notation4.js`: el motor del 4x4, los algoritmos y recetas de paridad comprobados, y la sección de 4x4 de la pestaña Notación.
- `js/storage.js`, `js/stats.js`, `js/timer.js`, `js/trainer.js`, `js/planview.js`, `js/app.js`: persistencia, estadísticas, cronómetro, entrenador, vista del plan y arranque.
