import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "home",
    navLabel: "Página de inicio",
    title: "Página de inicio — secciones, banners promo y vista previa",
    route: "/admin/annonce",
    intro:
      "Esta pantalla controla todo lo que se muestra en la página de inicio del sitio público. Tiene dos bloques: « Secciones de la página de inicio » (el orden y la visibilidad de las ocho grandes secciones: portada (héroe), los más vendidos, por necesidad, cita del farmacéutico, marcas, experiencia, rutina, banners promo) y « Banners promo » (los recuadros publicitarios que usted mismo crea, en tres formatos). Un botón « Vista previa » muestra la verdadera página de inicio en un marco reducido, tal como la ven los clientes. Todo cambio hecho aquí es visible para todos los visitantes del sitio.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 6, kind: "text", label: "Admin / Operaciones / Página de inicio" },
            { w: 3, kind: "button", label: "Vista previa", hotspot: 1 },
            { w: 3, kind: "button", label: "+ Crear banner", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Vista previa — página de inicio (sitio reducido en un marco, flecha para actualizar)", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "panel", label: "Secciones de la página de inicio: n.º · nombre · Visible/Oculta · ojo · flechas ↑↓", hotspot: 4 },
            { w: 3, kind: "button", label: "Guardar orden", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Banners promo: miniatura · título · insignia En línea/Fuera de línea · ↑↓ · ojo · lápiz · papelera", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Panel banner: tipo (editorial/hero/quote) · Visible en el sitio · contenido · imagen y enlace · guía de tipos", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Botón « Vista previa »",
        desc: "Muestra u oculta el marco de vista previa en la parte superior de la pantalla. Es la verdadera página de inicio (versión francesa) en miniatura: lo que usted ve es lo que ven los clientes.",
      },
      {
        n: 2,
        label: "Botón « Crear banner »",
        desc: "Abre el panel de creación de un banner a la derecha. No se guarda nada hasta que pulse « Crear banner » al final del panel.",
      },
      {
        n: 3,
        label: "Marco de vista previa",
        desc: "Muestra la versión guardada de la página de inicio. Después de guardar, espere unos instantes y pulse la pequeña flecha arriba a la derecha del marco para recargarlo. Si no hay ningún banner en línea, un mensaje lo indica debajo del marco.",
      },
      {
        n: 4,
        label: "Panel « Secciones de la página de inicio »",
        desc: "Las ocho secciones de la página de inicio, en su orden de visualización. El ojo muestra u oculta una sección, las flechas la suben o la bajan. Una sección oculta aparece en gris con la mención « Oculta ». Las secciones no se pueden eliminar.",
      },
      {
        n: 5,
        label: "Botón « Guardar orden »",
        desc: "Importante: en este panel, las flechas y el ojo solo preparan el cambio. No se aplica nada hasta que pulse este botón (permanece gris si no hay nada que guardar).",
      },
      {
        n: 6,
        label: "Lista de banners promo",
        desc: "Una fila por banner: miniatura, título (clicable para editar), insignia « En línea » o « Fuera de línea », y luego los botones: flechas para el orden, ojo para activar/desactivar, lápiz para editar, papelera para eliminar. A diferencia del panel de arriba, estos botones guardan de inmediato, sin botón de confirmación del orden.",
      },
      {
        n: 7,
        label: "Panel de creación / edición de un banner",
        desc: "De arriba abajo: la elección del tipo (editorial, hero o quote), el interruptor « Visible en el sitio », el bloque Contenido (título, descripción o cita, y para editorial el lado de la imagen, para quote la firma: nombre, título, foto), el bloque Imagen y enlace (imagen + destino y texto del botón), y al final la « Guía de tipos » con tres esquemas que muestran dónde va cada campo.",
      },
    ],
    workflows: [
      {
        title: "Poner un banner promocional en línea",
        steps: [
          {
            title: "Crear el banner",
            body: "Pulse « Crear banner » y elija el tipo: editorial (imagen + texto lado a lado), hero (gran imagen a pantalla completa con texto encima) o quote (cita sobre fondo oscuro, con firma).",
          },
          {
            title: "Rellenar el contenido",
            body: "El título es siempre obligatorio. La imagen y la descripción también lo son, salvo para el tipo quote (allí la descripción se convierte en la cita; la imagen principal no se muestra en este tipo, no hace falta subir una — solo aparece la foto de la firma). La guía al final del panel muestra dónde aparecerá cada campo.",
          },
          {
            title: "Añadir el botón (opcional)",
            body: "« CTA destino » es la dirección a la que el botón envía al cliente (por ejemplo una página del catálogo), « CTA label » es el texto del botón. Sin estos campos, el banner se muestra sin botón.",
          },
          {
            title: "Guardar",
            body: "Deje « Visible en el sitio » activado y pulse « Crear banner ». El banner aparece al final de la lista con la insignia « En línea ».",
          },
          {
            title: "Verificar que la sección está activada",
            body: "En el panel « Secciones de la página de inicio », la fila « Banners promo » debe estar marcada « Visible ». De lo contrario, ningún banner aparece en el sitio, aunque esté « En línea ».",
          },
          {
            title: "Controlar en el sitio",
            body: "Abra la vista previa (o la página de inicio pública): el banner aparece en menos de un minuto. Pulse la flecha de actualización del marco si hace falta.",
          },
        ],
      },
      {
        title: "Reorganizar u ocultar una sección de la página de inicio",
        steps: [
          {
            title: "Mover u ocultar",
            body: "En « Secciones de la página de inicio », use las flechas para cambiar el orden y el ojo para ocultar o volver a mostrar una sección. Las filas ocultas pasan a gris.",
          },
          {
            title: "Guardar el orden",
            body: "Pulse « Guardar orden ». Mientras no lo haga, no se aplica nada — si sale de la página antes, sus cambios se pierden.",
          },
          {
            title: "Verificar",
            body: "El sitio público adopta la nueva disposición de inmediato: recargue la página de inicio pública (o la vista previa) para controlar el resultado en los tres idiomas.",
          },
        ],
      },
      {
        title: "Apagar temporalmente un banner",
        steps: [
          {
            title: "Pulsar el ojo",
            body: "En la lista de banners, pulse el ojo de la fila correspondiente. La insignia pasa a « Fuera de línea » de inmediato, sin paso de confirmación.",
          },
          {
            title: "Verificar en el sitio",
            body: "El banner desaparece de la página de inicio pública en menos de un minuto. El banner y todo su contenido permanecen guardados.",
          },
          {
            title: "Volver a ponerlo más adelante",
            body: "Pulse el ojo de nuevo: la insignia vuelve a « En línea » y el banner regresa al sitio, en el mismo lugar del orden.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Guardar el orden de las secciones",
        where: "Panel « Secciones de la página de inicio »: flechas + ojo, luego botón « Guardar orden »",
        does: "Aplica el nuevo orden y la visibilidad de las ocho secciones de la página de inicio. Las flechas y el ojo por sí solos solo preparan el cambio: únicamente este botón guarda.",
        effects: [
          "El orden y la visibilidad quedan guardados en la base de datos.",
          "La página de inicio pública se regenera de inmediato en los tres idiomas: los visitantes ven la nueva disposición desde la próxima carga.",
          "Una sección oculta desaparece por completo de la página de inicio (no se elimina: su contenido vuelve en cuanto se muestra de nuevo).",
          "Ocultar la sección « Banners promo » esconde todos los banners de golpe, incluso los marcados « En línea ».",
        ],
        severity: "caution",
        undo: "Vuelva a poner el orden y la visibilidad deseados y pulse de nuevo « Guardar orden »: el efecto es inmediato y nunca se pierde nada.",
        audited: true,
        publicImpact: "La disposición de la página de inicio cambia para todos los visitantes, de inmediato.",
      },
      {
        label: "Crear banner",
        where: "Botón « Crear banner » arriba, luego « Crear banner » al final del panel",
        does: "Guarda un nuevo recuadro promocional (tipo editorial, hero o quote) con su título, su texto, su imagen, su botón opcional y su estado visible/oculto.",
        effects: [
          "El banner queda guardado en la base de datos y se añade al final de la lista.",
          "Si « Visible en el sitio » está activado Y la sección « Banners promo » está marcada « Visible », aparece en la página de inicio pública en menos de un minuto.",
          "Para los tipos editorial y hero, el guardado se rechaza si falta la imagen o la descripción (un mensaje lo indica). Para el tipo quote, solo cuentan el título y la cita: la imagen principal no se muestra en el sitio para este tipo (solo aparece la foto de la firma).",
        ],
        severity: "caution",
        undo: "Pulse el ojo de la fila para ponerlo « Fuera de línea », o elimínelo con la papelera.",
        audited: true,
        publicImpact: "Un nuevo recuadro aparece en la página de inicio para todos los visitantes, en menos de un minuto.",
      },
      {
        label: "Editar un banner",
        where: "Lápiz al final de la fila (o clic en el título), luego « Guardar » al final del panel",
        does: "Reemplaza el contenido del banner por lo que se muestra en el panel: tipo, título, textos, imagen, botón, estado visible/oculto.",
        effects: [
          "El nuevo contenido queda guardado y reemplaza al anterior.",
          "La página de inicio pública refleja la modificación en menos de un minuto.",
          "Cambiar el tipo (por ejemplo editorial → quote) cambia por completo la presentación del recuadro en el sitio.",
        ],
        severity: "caution",
        undo: "Vuelva a abrir el banner y reintroduzca los valores anteriores (anótelos antes de modificar: no se conservan en ningún otro lugar).",
        audited: true,
        publicImpact: "El recuadro cambia de apariencia en la página de inicio en menos de un minuto.",
      },
      {
        label: "Activar / desactivar un banner (ojo)",
        where: "Ojo en la fila del banner, en la lista « Banners promo »",
        does: "Alterna el banner entre « En línea » y « Fuera de línea ». El guardado es inmediato: no hay ventana de confirmación ni botón que pulsar después.",
        effects: [
          "La insignia de la fila cambia de inmediato.",
          "El banner aparece o desaparece de la página de inicio pública en menos de un minuto (siempre que la sección « Banners promo » esté visible).",
          "Todo el contenido del banner se conserva: es un simple interruptor.",
        ],
        severity: "caution",
        undo: "Pulse el ojo de nuevo: el banner vuelve exactamente como antes.",
        audited: true,
        publicImpact: "Muestra o retira el recuadro de la página de inicio para todos los visitantes.",
      },
      {
        label: "Subir / bajar un banner (flechas)",
        where: "Flechas ↑↓ en la fila del banner, en la lista « Banners promo »",
        does: "Intercambia la posición del banner con su vecino. El guardado es inmediato, sin confirmación.",
        effects: [
          "El orden de la lista cambia enseguida en el admin.",
          "En la página de inicio pública, los banners se muestran en ese mismo orden; el cambio es visible en menos de un minuto.",
        ],
        severity: "caution",
        undo: "Pulse la flecha opuesta para volver al orden anterior.",
        audited: true,
        publicImpact: "El orden de los recuadros cambia en la página de inicio.",
      },
      {
        label: "Eliminar un banner",
        where: "Papelera al final de la fila, luego « Sí, eliminar » en la ventana de confirmación",
        does: "Borra definitivamente el banner de la base de datos: título, textos, ajustes. Primero se muestra una ventana de confirmación.",
        effects: [
          "El banner desaparece de la lista y no puede restaurarse: para volver a ponerlo habrá que recrearlo por completo (la imagen en sí permanece en el espacio de almacenamiento, pero todo lo demás se pierde).",
          "Desaparece de la página de inicio pública en menos de un minuto.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "El recuadro desaparece de la página de inicio para todos los visitantes.",
      },
    ],
    gotchas: [
      "Conviven dos lógicas de guardado: el panel « Secciones de la página de inicio » no aplica nada hasta que pulse « Guardar orden », mientras que las flechas y el ojo de la lista de banners guardan de inmediato, sin confirmación.",
      "Un banner « En línea » permanece invisible si la sección « Banners promo » está oculta en el panel de arriba. Verifique siempre ambos.",
      "El nuevo orden de las secciones se aplica de inmediato en el sitio; los cambios de banners pueden tardar hasta un minuto en aparecer. Si no ve nada, espere un poco y recargue.",
      "La vista previa muestra la versión guardada (en francés): nunca muestra un panel en curso de edición. Guarde primero y luego pulse la flecha de actualización del marco.",
      "Las ocho secciones de la página de inicio no se pueden eliminar, solo ocultar o mover. Evite ocultar « Portada (héroe) »: es la primera pantalla que ven los clientes.",
      "La sección « Cita del farmacéutico » solo muestra algo si al menos un producto del catálogo tiene un consejo del farmacéutico rellenado; de lo contrario permanece vacía aunque esté marcada « Visible ».",
      "Para el tipo quote, el campo « Descripción » se convierte en la cita misma y la firma (nombre, título, foto) se muestra debajo; el botón no existe en este tipo. El lado de la imagen (izquierda/derecha) solo afecta al tipo editorial.",
      "La eliminación de un banner es definitiva: prefiera el ojo (« Fuera de línea ») si piensa reutilizarlo más adelante.",
    ],
  },
  {
    id: "blog",
    navLabel: "Blog",
    title: "Blog — escribir, publicar y retirar artículos",
    route: "/admin/blog",
    intro:
      "Esta pantalla gestiona los artículos del blog del sitio público: consejos, novedades de la farmacia, dosieres sobre el cuidado de la piel. Un artículo se escribe en un solo idioma (francés, español o inglés), con un título, una dirección de página, un contenido con formato en un editor visual, un extracto, una imagen de portada y un autor. Mientras la casilla « Publicado » no esté marcada, el artículo es un borrador invisible para los clientes. Una vez publicado, aparece en el sitio en menos de un minuto.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "N artículos" },
            { w: 4, kind: "button", label: "Nuevo artículo", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Lista: título · insignia Publicado/Borrador · idioma · /dirección-de-la-página · fecha", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "panel", label: "Botones « Editar »", hotspot: 3 },
            { w: 6, kind: "panel", label: "« Eliminar » — inmediato, sin confirmación", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Ventana artículo: título · dirección · idioma · autor · extracto · editor de texto · portada · casilla Publicado", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Botón « Nuevo artículo »",
        desc: "Abre la ventana de redacción vacía. No se guarda nada hasta que pulse « Guardar » abajo.",
      },
      {
        n: 2,
        label: "Lista de artículos",
        desc: "Una fila por artículo, del más reciente al más antiguo: el título (clicable para editar), la insignia « Publicado » (verde) o « Borrador » (gris), la etiqueta de idioma (FR/ES/EN), la dirección de la página y la fecha de publicación.",
      },
      {
        n: 3,
        label: "Botón « Editar »",
        desc: "Abre la ventana de redacción ya rellenada con el contenido actual del artículo (hacer clic en el título hace lo mismo).",
      },
      {
        n: 4,
        label: "Botón « Eliminar »",
        desc: "Atención: la eliminación se ejecuta inmediatamente al hacer clic, sin ventana de confirmación. El artículo se borra definitivamente.",
      },
      {
        n: 5,
        label: "Ventana de redacción",
        desc: "De arriba abajo: Título (al crear, rellena automáticamente la dirección de la página); dirección de la página; Idioma y Autor; Extracto (el resumen mostrado en la lista del blog); Contenido (editor visual: negrita, cursiva, títulos, listas, cita, enlace, imagen, deshacer/rehacer); Imagen de portada (subida desde su computadora); y la casilla « Publicado ».",
      },
    ],
    workflows: [
      {
        title: "Escribir y publicar un artículo",
        steps: [
          {
            title: "Crear el borrador",
            body: "Pulse « Nuevo artículo » y escriba el título: la dirección de la página se rellena sola. Elija el idioma de redacción y el autor.",
          },
          {
            title: "Redactar el contenido",
            body: "Escriba en el editor visual: la barra de herramientas permite negrita, cursiva, dos niveles de títulos, listas, citas, enlaces e inserción de imágenes. No se necesitan conocimientos técnicos.",
          },
          {
            title: "Cuidar el extracto y la portada",
            body: "El extracto es el pequeño resumen mostrado en la página del blog; la imagen de portada ilustra la miniatura y la cabecera del artículo. Ambos son opcionales pero recomendados.",
          },
          {
            title: "Publicar",
            body: "Marque « Publicado » y pulse « Guardar ». La fecha de publicación se fija en ese momento.",
          },
          {
            title: "Verificar en el sitio",
            body: "El artículo aparece en la página Blog del sitio público en menos de un minuto, con una pequeña etiqueta que indica su idioma.",
          },
        ],
      },
      {
        title: "Corregir un artículo ya publicado",
        steps: [
          {
            title: "Abrir el artículo",
            body: "Haga clic en su título o en el botón « Editar »: la ventana se abre ya rellenada.",
          },
          {
            title: "Hacer la corrección",
            body: "Modifique el texto, la imagen o el extracto. Evite tocar la dirección de la página: cambiarla rompería los enlaces ya compartidos (la dirección antigua llevaría a una página inexistente).",
          },
          {
            title: "Guardar",
            body: "La versión corregida reemplaza a la anterior en el sitio en menos de un minuto. La fecha de publicación original se conserva.",
          },
        ],
      },
      {
        title: "Retirar un artículo del sitio sin eliminarlo",
        steps: [
          {
            title: "Abrir el artículo",
            body: "Pulse « Editar » en la fila del artículo publicado.",
          },
          {
            title: "Desmarcar « Publicado »",
            body: "Desmarque la casilla al final de la ventana y luego « Guardar ». La insignia vuelve a « Borrador ».",
          },
          {
            title: "Verificar",
            body: "El artículo desaparece de la página Blog en menos de un minuto (su página directa deja de existir). Todo su contenido permanece guardado en el admin.",
          },
          {
            title: "Republicarlo más adelante",
            body: "Vuelva a marcar « Publicado » y guarde: el artículo regresa al sitio con su fecha de publicación original, que no cambia.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Crear un artículo",
        where: "Botón « Nuevo artículo », luego « Guardar » al final de la ventana",
        does: "Guarda un nuevo artículo con su título, su dirección de página, su idioma, su contenido, su extracto, su portada, su autor y su estado publicado o borrador.",
        effects: [
          "El artículo queda guardado en la base de datos y aparece arriba de la lista.",
          "Borrador (casilla desmarcada): invisible para los clientes, puede volver a él cuando quiera.",
          "Publicado (casilla marcada): la fecha de publicación se fija y el artículo aparece en la página Blog del sitio en menos de un minuto.",
          "El título y la dirección de la página son obligatorios. Si la dirección ya la usa otro artículo, el guardado se rechaza con un mensaje.",
        ],
        severity: "caution",
        undo: "Desmarque « Publicado » para retirarlo del sitio, o elimine el artículo.",
        audited: true,
        publicImpact: "Si está publicado, el artículo aparece en la página Blog del sitio en menos de un minuto, en todas las versiones del sitio.",
      },
      {
        label: "Editar un artículo",
        where: "Título del artículo o botón « Editar », luego « Guardar »",
        does: "Reemplaza el contenido del artículo por lo que se muestra en la ventana (título, dirección, idioma, texto, extracto, portada, autor, estado publicado).",
        effects: [
          "La nueva versión reemplaza a la anterior — el texto antiguo no se conserva.",
          "Si el artículo está publicado, la versión corregida se sirve a los visitantes en menos de un minuto.",
          "Cambiar la dirección de la página hace que la antigua deje de existir: los enlaces ya compartidos dejarán de funcionar.",
          "La fecha de publicación original no cambia, incluso tras varias modificaciones.",
        ],
        severity: "caution",
        undo: "Vuelva a abrir el artículo y reintroduzca el texto anterior (no se conserva en ningún otro lugar: cópielo antes de una reescritura grande).",
        audited: true,
        publicImpact: "Los visitantes ven la nueva versión del artículo en menos de un minuto.",
      },
      {
        label: "Publicar / despublicar (casilla « Publicado »)",
        where: "Casilla « Publicado » al final de la ventana de redacción, luego « Guardar »",
        does: "Pone el artículo en línea o lo retira del sitio, sin tocar su contenido. Es el interruptor principal del artículo.",
        effects: [
          "Marcada: el artículo aparece en la página Blog en menos de un minuto. En la primerísima publicación se fija la fecha de publicación; ya no cambiará después, ni siquiera tras un retiro y una republicación.",
          "Desmarcada: el artículo desaparece del sitio en menos de un minuto (su página deja de existir), pero todo se conserva en el admin con la insignia « Borrador ».",
        ],
        severity: "caution",
        undo: "Vuelva a marcar (o desmarcar) la casilla y guarde de nuevo: nunca se pierde nada.",
        audited: true,
        publicImpact: "Hace aparecer o desaparecer el artículo en el sitio público, en menos de un minuto.",
      },
      {
        label: "Eliminar un artículo",
        where: "Botón « Eliminar » al final de la fila",
        does: "Borra definitivamente el artículo de la base de datos. Atención: la eliminación se ejecuta inmediatamente al hacer clic, NO hay ventana de confirmación.",
        effects: [
          "El artículo desaparece de la lista y no puede restaurarse: el título, el texto y el extracto se pierden (las imágenes ya subidas permanecen en el espacio de almacenamiento, pero habrá que reescribirlo todo).",
          "Si estaba publicado, desaparece del sitio en menos de un minuto y su dirección deja de existir.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "El artículo desaparece de la página Blog y su dirección lleva a una página inexistente.",
      },
    ],
    flows: [
      {
        title: "Vida de un artículo",
        lanes: [
          [
            {
              label: "Borrador",
              tone: "neutral",
              note: "Visible únicamente en el admin. Puede retrabajarlo tantas veces como sea necesario.",
            },
            {
              label: "Publicado",
              tone: "ok",
              note: "En línea en la página Blog en menos de un minuto. La fecha de publicación se fija en la primera publicación y ya no cambia.",
            },
            {
              label: "Retirado (de nuevo borrador)",
              tone: "warn",
              note: "Casilla « Publicado » desmarcada: el artículo sale del sitio pero se conserva en el admin. Vuelva a marcarla para republicarlo.",
            },
          ],
          [
            {
              label: "Eliminado",
              tone: "bad",
              note: "Borrado definitivamente, sin confirmación previa. Imposible de restaurar.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "« Eliminar » borra el artículo inmediatamente, SIN ventana de confirmación. Si duda, desmarque mejor « Publicado »: el artículo sale del sitio pero sigue siendo recuperable.",
      "La dirección de la página se rellena automáticamente a partir del título solo al crear; al editar, ya no sigue al título. Cambiarla en un artículo publicado rompe los enlaces ya compartidos.",
      "Dos artículos no pueden tener la misma dirección de página: el guardado se rechaza con un mensaje que indica que ya existe un artículo con ese slug.",
      "El artículo no se traduce automáticamente: se muestra tal como fue redactado. La página Blog del sitio muestra todos los artículos publicados sea cual sea el idioma elegido por el visitante, con una pequeña etiqueta (FR/ES/EN) que indica el idioma de redacción.",
      "La fecha de publicación queda fijada en la primera publicación: despublicar y volver a publicar no la actualiza.",
      "Cuente hasta un minuto antes de ver un cambio (publicación, corrección, retiro) en el sitio público. Si nada se mueve, espere un poco y recargue la página.",
      "El contenido se redacta en un editor visual (negrita, títulos, listas, enlaces, imágenes): no hace falta — ni es posible — pegar código.",
    ],
  },
]
