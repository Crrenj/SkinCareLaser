import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "tags",
    navLabel: "Etiquetas",
    title: "Etiquetas — los filtros y necesidades del catálogo",
    route: "/admin/tags",
    intro:
      "Las etiquetas clasifican los productos por tema: necesidades (hidratación, antiedad…), tipos de piel, ingredientes, etc. Se organizan en dos niveles: tipos de etiqueta (las familias), cada uno con sus etiquetas dentro. Esta pantalla sirve para crear, renombrar y eliminar tipos y etiquetas. Atención: aquí NO se asocian las etiquetas a los productos — eso se hace en la ficha de cada producto, en la página Productos. Lo que hace aquí alimenta el sitio público: los filtros del catálogo, las páginas de necesidades y las tarjetas de necesidades de la página de inicio. (En cambio, las etiquetas nunca se muestran en las fichas de producto del sitio: sirven para filtrar, no para describir.)",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catálogo / Etiquetas", hotspot: 1 },
            { w: 4, kind: "button", label: "+ Nuevo tipo de etiqueta", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Tipos", hotspot: 3 },
            { w: 3, kind: "kpi", label: "Etiquetas" },
            { w: 3, kind: "kpi", label: "● Besoins" },
            { w: 3, kind: "kpi", label: "● Types de peau" },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "● Besoins · 14 etiquetas", hotspot: 4 },
            { w: 2, kind: "button", label: "✎ · 🗑", hotspot: 5 },
            { w: 3, kind: "button", label: "+ Etiqueta", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Hydratation · dirección de página · ✎ 🗑 al pasar el cursor", hotspot: 7 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "● Types de peau — la tarjeta siguiente, misma estructura" },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Encabezado",
        desc: "Ruta « Admin / Catálogo / Etiquetas » y título de la página. Nada que modificar aquí.",
      },
      {
        n: 2,
        label: "Botón « Nuevo tipo de etiqueta »",
        desc: "Abre una ventana para crear una nueva familia: nombre, dirección de página (se rellena automáticamente mientras escribe el nombre), ícono, color y — opcionalmente — una primera etiqueta creada en el mismo paso.",
      },
      {
        n: 3,
        label: "Tarjetas de cifras",
        desc: "Número de tipos, número total de etiquetas y el detalle de los dos primeros tipos. Se recalculan en cada visualización — solo lectura.",
      },
      {
        n: 4,
        label: "Tarjeta de un tipo",
        desc: "Cada tipo de etiqueta tiene su propia tarjeta: punto de color, nombre, número de etiquetas y dirección de página. Las etiquetas del tipo se listan debajo.",
      },
      {
        n: 5,
        label: "Lápiz y papelera del tipo",
        desc: "El lápiz modifica el tipo (nombre, dirección, ícono, color). La papelera lo elimina — aparece atenuada e inutilizable mientras el tipo contenga al menos una etiqueta.",
      },
      {
        n: 6,
        label: "Botón « Etiqueta »",
        desc: "Crea una nueva etiqueta directamente en ese tipo. La ventana que se abre se titula « Nuevo tag » — tag y etiqueta designan exactamente lo mismo.",
      },
      {
        n: 7,
        label: "Fila de etiqueta",
        desc: "Nombre de la etiqueta y, debajo, su dirección de página. El lápiz (editar) y la papelera (eliminar) solo aparecen al pasar el cursor por encima de la fila.",
      },
    ],
    workflows: [
      {
        title: "Crear una nueva familia de filtros",
        steps: [
          {
            title: "Cree el tipo",
            body: "Pulse « Nuevo tipo de etiqueta ». Póngale un nombre claro (la dirección se rellena sola), elija un ícono y un color — solo sirven en esta pantalla. Puede crear la primera etiqueta en la misma ventana.",
          },
          {
            title: "Añada sus etiquetas",
            body: "En la tarjeta del nuevo tipo, pulse « Etiqueta » y cree los valores uno por uno (por ejemplo, para un tipo « Textura »: crema, gel, aceite…).",
          },
          {
            title: "Etiquete los productos",
            body: "Vaya a la página Productos, abra cada ficha correspondiente y marque las nuevas etiquetas en la zona prevista. Es este paso el que conecta los productos con los filtros.",
          },
          {
            title: "Verifique en el sitio",
            body: "En el catálogo público, la nueva familia de filtros aparece en la columna izquierda en aproximadamente un minuto. Atención: las etiquetas figuran allí incluso sin ningún producto (el contador muestra 0).",
          },
        ],
      },
      {
        title: "Añadir una nueva necesidad (ej. « Pieles sensibles »)",
        steps: [
          {
            title: "Cree la etiqueta en el tipo « Besoins »",
            body: "En la tarjeta « Besoins » (las necesidades), pulse « Etiqueta », escriba el nombre y verifique la dirección propuesta: formará el enlace público /besoins/… de la página dedicada a esa necesidad.",
          },
          {
            title: "Asocie productos",
            body: "En la página Productos, marque esta etiqueta en todos los productos correspondientes. Sin productos asociados, la página de la necesidad existe pero se muestra vacía.",
          },
          {
            title: "Sepa qué no se actualiza solo",
            body: "El menú « Necesidades » de la barra de navegación del sitio es una lista fija de cinco entradas: su nueva necesidad no aparecerá allí automáticamente. Los clientes llegan a ella por los filtros del catálogo o por un enlace directo.",
          },
        ],
      },
      {
        title: "Eliminar una etiqueta que ya no sirve",
        steps: [
          {
            title: "Mida el impacto antes de pulsar",
            body: "La eliminación retira al instante la etiqueta de TODOS los productos que la llevan, sin lista de control previa. Si duda, verifique primero en el catálogo público cuántos productos están afectados usando el filtro correspondiente.",
          },
          {
            title: "Elimine y confirme",
            body: "Pase el cursor por la fila de la etiqueta, pulse la papelera y confirme en la ventana, que recuerda que la etiqueta será retirada de todos los productos asociados.",
          },
          {
            title: "Entienda que es definitivo",
            body: "Volver a crear más adelante una etiqueta con el mismo nombre NO recupera los vínculos con los productos: habría que volver a etiquetar cada ficha una por una en la página Productos.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Nuevo tipo de etiqueta",
        where: "Botón arriba a la derecha de la pantalla (abre una ventana en el centro)",
        does: "Crea una nueva familia de etiquetas: nombre, dirección de página, ícono, color y, opcionalmente, una primera etiqueta.",
        effects: [
          "El tipo se guarda en la base de datos; si el nombre o la dirección ya los usa otro tipo, la creación se rechaza con un mensaje.",
          "Si rellenó el campo « Tag inicial », se crea de paso una primera etiqueta dentro del tipo.",
          "El tipo aparece de inmediato como una nueva tarjeta en esta pantalla y en los contadores.",
          "Mientras el tipo no contenga ninguna etiqueta, es invisible para los clientes. En cuanto contiene una, una nueva familia de filtros aparece en el catálogo público, en aproximadamente un minuto.",
          "El título de esa familia de cara al cliente se deriva de la dirección del tipo (los guiones se reemplazan por espacios) — no del nombre escrito aquí. Para las familias históricas (necesidades, tipos de piel, ingredientes…), el sitio muestra su propia traducción.",
        ],
        severity: "caution",
        undo: "Elimine primero la eventual etiqueta inicial y luego el tipo en sí con la papelera.",
        audited: true,
        publicImpact: "Con al menos una etiqueta, una nueva familia de filtros aparece en el catálogo público en aproximadamente un minuto.",
      },
      {
        label: "Editar tipo (lápiz)",
        where: "Ícono de lápiz en el encabezado de cada tarjeta de tipo",
        does: "Cambia el nombre, la dirección de página, el ícono y el color del tipo.",
        effects: [
          "El nombre, el ícono y el color solo cambian la visualización en esta pantalla de administración — nunca se muestran a los clientes.",
          "Si el nuevo nombre o la nueva dirección ya los usa otro tipo, la modificación se rechaza con un mensaje.",
          "Cambiar la dirección de un tipo que usted mismo creó es poco arriesgado: solo dependen de ella el título de la familia de filtros del catálogo y los enlaces de filtro ya compartidos.",
          "En cambio, no cambie la dirección de los tipos históricos. La de « types-peau » la usa tal cual el menú « Catálogo » de la barra de navegación del sitio (columna de tipos de piel): cambiarla dejaría esos enlaces del menú sin efecto. Y las de « types-peau », « ingredients » y « categories » activan el título traducido de la familia en los filtros.",
          "EXCEPCIÓN CRÍTICA: no cambie nunca la dirección del tipo « besoins ». Todas las páginas públicas /besoins/… y los enlaces del menú « Necesidades » del sitio dependen de esa dirección exacta: cambiarla mostraría « página no encontrada » por todas partes, y las tarjetas de necesidades de la página de inicio llevarían a un catálogo sin filtrar.",
        ],
        severity: "caution",
        undo: "Vuelva a abrir el tipo con el lápiz y restablezca los valores anteriores, en particular la dirección anterior.",
        audited: true,
        publicImpact: "Cambiar la dirección del tipo « besoins » rompería todas las páginas /besoins/… del sitio.",
      },
      {
        label: "Eliminar tipo (papelera)",
        where: "Ícono de papelera en el encabezado de cada tarjeta de tipo",
        does: "Elimina definitivamente un tipo de etiqueta VACÍO, previa confirmación.",
        effects: [
          "La papelera aparece atenuada e inutilizable mientras el tipo contenga al menos una etiqueta; incluso forzándolo, el servidor lo rechaza con un mensaje que indica que el tipo aún contiene tags. Primero hay que eliminar sus etiquetas una por una.",
          "La ventana de confirmación anuncia que « este tipo y todas sus etiquetas serán eliminados » — en realidad, la eliminación solo es posible si el tipo ya está vacío. Por tanto, ninguna etiqueta puede desaparecer con esta acción.",
          "Si el tipo está vacío, se borra definitivamente de la base de datos y desaparece de la pantalla y de los contadores.",
          "Sin impacto en el sitio público: un tipo sin etiquetas de todos modos no se mostraba allí.",
        ],
        severity: "caution",
        undo: "Vuelva a crear un tipo con el mismo nombre, la misma dirección, el mismo ícono y el mismo color: no había nada más guardado.",
        audited: true,
      },
      {
        label: "Etiqueta (botón « + » de cada tarjeta)",
        where: "Encabezado de cada tarjeta de tipo (abre la ventana « Nuevo tag »)",
        does: "Crea una etiqueta dentro de ese tipo, con un nombre y una dirección de página.",
        effects: [
          "La etiqueta se guarda en la base de datos, vinculada al tipo de la tarjeta (el tipo no se puede cambiar en la ventana).",
          "La dirección se rellena automáticamente a partir del nombre; dos etiquetas del mismo tipo no pueden compartir la misma dirección (un mensaje indica que ese tag ya existe), pero dos tipos distintos sí pueden.",
          "La etiqueta aparece de inmediato en la lista de la tarjeta y en los contadores.",
          "Aparece en los filtros del catálogo público en aproximadamente un minuto — INCLUSO sin ningún producto asociado (el contador del filtro muestra entonces 0).",
          "Si se crea en el tipo « Besoins », una página pública /besoins/… queda accesible en su dirección (vacía mientras ningún producto lleve la etiqueta).",
          "Pasa a poder marcarse en las fichas de producto de la página Productos: es allí, y no aquí, donde se asocia a los productos.",
        ],
        severity: "caution",
        undo: "Elimine la etiqueta con la papelera — sin consecuencias mientras ningún producto haya sido asociado a ella.",
        audited: true,
        publicImpact: "La etiqueta aparece en los filtros del catálogo público en aproximadamente un minuto, incluso con cero productos.",
      },
      {
        label: "Editar etiqueta (lápiz)",
        where: "Ícono de lápiz al pasar el cursor por cada fila de etiqueta",
        does: "Cambia el nombre y la dirección de página de la etiqueta. El tipo al que pertenece, en cambio, no se puede modificar.",
        effects: [
          "El nuevo nombre reemplaza al anterior en todos los lugares donde se muestra: filtros del catálogo, título de la página de la necesidad y tarjeta de la página de inicio si corresponde (las fichas de producto, por su parte, no muestran las etiquetas). El sitio público se actualiza en aproximadamente un minuto.",
          "A diferencia de la creación, la dirección ya no sigue al nombre: se queda tal cual mientras usted no la cambie — es a propósito, para no romper los enlaces existentes.",
          "Si cambia la dirección de una etiqueta del tipo « Besoins », su página pública /besoins/… se muda: la dirección anterior muestra « página no encontrada » (incluidos los enlaces ya compartidos y los resultados de Google).",
          "Si la nueva dirección ya la usa otra etiqueta del mismo tipo, la modificación se rechaza con un mensaje.",
          "Los productos asociados lo siguen estando: solo cambian el nombre y la dirección, no se pierde ningún vínculo.",
          "Es imposible mover una etiqueta a otro tipo: habría que eliminarla y volver a crearla en otro lugar — perdiendo sus vínculos con los productos.",
        ],
        severity: "caution",
        undo: "Vuelva a abrir la etiqueta con el lápiz y restablezca el nombre y la dirección anteriores.",
        audited: true,
        publicImpact: "El nombre cambia en todo el sitio; un cambio de dirección rompe los enlaces antiguos hacia la página de la necesidad.",
      },
      {
        label: "Eliminar etiqueta (papelera)",
        where: "Ícono de papelera al pasar el cursor por cada fila de etiqueta",
        does: "Elimina definitivamente la etiqueta, previa confirmación.",
        effects: [
          "Una ventana de confirmación advierte: « Esta etiqueta será retirada de todos los productos asociados ».",
          "La eliminación borra la etiqueta Y todos sus vínculos con los productos, automáticamente y de una sola vez — esté puesta en 1 o en 100 productos, sin lista de control previa.",
          "Volver a crear más adelante una etiqueta con el mismo nombre no restaura NADA: los productos no la recuperan; hay que volver a etiquetar cada ficha a mano en la página Productos.",
          "En el sitio público (en aproximadamente un minuto): la etiqueta desaparece de los filtros del catálogo; si era una necesidad, su página /besoins/… muestra « página no encontrada ».",
          "Si la etiqueta era una de las tres necesidades destacadas en la página de inicio, su tarjeta desaparece y la página de inicio pasa a una selección de reserva predefinida.",
          "Si era una de las cinco necesidades del menú « Necesidades » de la barra de navegación (Hidratación, Antiedad, Protección solar, Acné e imperfecciones, Manchas), el enlace del menú sigue visible pero lleva a « página no encontrada ».",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "La etiqueta y sus vínculos con los productos desaparecen del sitio; una página /besoins/… puede quedar no encontrada.",
      },
    ],
    gotchas: [
      "Esta pantalla gestiona el vocabulario, no las asociaciones: para poner o quitar una etiqueta en un producto, pase por la ficha del producto en la página Productos.",
      "Eliminar una etiqueta es la acción más arriesgada de la pantalla: desvincula al instante todos los productos que la llevan, y volver a crear la etiqueta no recupera esos vínculos. No existe ninguna papelera de recuperación.",
      "Una etiqueta aparece en los filtros del catálogo público incluso sin ningún producto (contador 0). Evite crear etiquetas « para más adelante »: los clientes las ven.",
      "El tipo « besoins » es especial: su dirección alimenta todas las páginas públicas /besoins/… y los enlaces de las tarjetas de necesidades de la página de inicio. No cambie nunca su dirección, y piénselo dos veces antes de tocar las etiquetas que contiene.",
      "El menú « Necesidades » de la barra de navegación del sitio es una lista fija de cinco entradas (Hidratación, Antiedad, Protección solar, Acné e imperfecciones, Manchas): crear una nueva necesidad no la añade allí, y eliminar o cambiar la dirección de una de esas cinco rompe el enlace del menú.",
      "Las tres tarjetas de necesidades de la página de inicio corresponden a etiquetas marcadas como « destacadas » directamente en la base de datos: ese ajuste NO se puede modificar desde esta pantalla — consulte con el responsable técnico para cambiar la selección.",
      "El ícono y el color de un tipo solo sirven para distinguir las tarjetas en esta pantalla de administración: los clientes nunca los ven.",
      "La ventana de confirmación al eliminar un tipo anuncia que sus etiquetas se eliminarían con él — es engañoso: en la práctica, la papelera de un tipo solo se puede pulsar si ya está vacío, y el servidor de todos modos se niega a eliminar un tipo que contiene etiquetas.",
      "Una etiqueta no puede cambiar de tipo después de su creación: el lápiz solo modifica el nombre y la dirección. Moverla = eliminarla y volver a crearla, perdiendo las asociaciones con los productos.",
      "El sitio público se actualiza solo en aproximadamente un minuto (catálogo, páginas de necesidades, inicio). No hace falta recargar una y otra vez.",
      "En las ventanas de creación y edición, « tag » y « etiqueta » designan exactamente lo mismo, y el campo « Slug » corresponde a la dirección de la página en el sitio.",
    ],
  },
]
