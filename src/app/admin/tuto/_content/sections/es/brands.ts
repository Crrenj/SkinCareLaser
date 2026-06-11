import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "brands",
    navLabel: "Marcas y gamas",
    title: "Marcas y gamas — la estructura del catálogo",
    route: "/admin/marques",
    intro:
      "Esta pantalla organiza el catálogo en dos niveles: cada marca contiene gamas, y cada producto está vinculado a una gama (el vínculo del producto se hace en la página Productos). Aquí crea, renombra y elimina las marcas y sus gamas. Lo que haga aquí se refleja en el sitio público: la página « Marcas », la página de cada marca, los filtros del catálogo, las fichas de producto y la franja de marcas de la página de inicio.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catálogo / Marcas", hotspot: 1 },
            { w: 4, kind: "button", label: "+ Añadir marca", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "Buscar por nombre o slug…", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Marcas", hotspot: 4 },
            { w: 4, kind: "kpi", label: "Gamas" },
            { w: 4, kind: "kpi", label: "Gamas / marca" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "› Marca · Slug · Gamas (+) · lápiz · papelera", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 1, kind: "text", label: "└" },
            { w: 11, kind: "table", label: "Gamas desplegadas · lápiz · papelera", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Encabezado",
        desc: "Ruta de navegación « Admin / Catálogo / Marcas » y título de la página. Aquí no hay nada que modificar.",
      },
      {
        n: 2,
        label: "Botón « Añadir marca »",
        desc: "Abre un panel a la derecha para crear una nueva marca: nombre + dirección de la página en el sitio (el campo « Slug »). La dirección se rellena sola mientras escribe el nombre.",
      },
      {
        n: 3,
        label: "Búsqueda",
        desc: "Filtra la lista de marcas por nombre o por dirección de página, al instante. Es un simple filtro de visualización: no modifica nada.",
      },
      {
        n: 4,
        label: "Tres tarjetas de cifras",
        desc: "Número de marcas, número total de gamas y promedio de gamas por marca. Se recalculan cada vez que se abre la página — solo lectura.",
      },
      {
        n: 5,
        label: "Fila de marca",
        desc: "De izquierda a derecha: la flecha despliega o pliega las gamas de la marca; el nombre; la dirección de página (columna « Slug »); el número de gamas seguido de un botón « + » verde que crea una gama vinculada directamente a esa marca; luego el lápiz (editar) y la papelera (eliminar).",
      },
      {
        n: 6,
        label: "Filas de gamas",
        desc: "Cuando una marca está desplegada, sus gamas aparecen debajo, ligeramente sangradas: nombre, dirección de página, etiqueta « Gama », y luego el lápiz y la papelera propios de cada gama.",
      },
    ],
    workflows: [
      {
        title: "Dar de alta una nueva marca",
        steps: [
          {
            title: "Crear la marca",
            body: "Haga clic en « Añadir marca ». Escriba el nombre: la dirección de página se rellena automáticamente. Verifíquela (formará el enlace público /marques/...) y luego valide.",
          },
          {
            title: "Crear su primera gama",
            body: "En la fila de la marca, haga clic en el « + » verde de la columna Gamas. La marca ya viene prellenada y no se puede cambiar. Póngale un nombre a la gama y valide.",
          },
          {
            title: "Vincular los productos",
            body: "Vaya a la página Productos para crear o editar los productos y asignarles esa gama. Sin un producto activo, la marca y la gama todavía no aparecen en los filtros del catálogo público.",
          },
          {
            title: "Comprobar en el sitio",
            body: "La nueva marca aparece en la página pública « Marcas » en unos minutos, incluso sin productos. Evite por tanto crear la marca mucho antes que sus productos: su tarjeta mostraría « 0 productos ».",
          },
        ],
      },
      {
        title: "Renombrar una marca sin romper los enlaces",
        steps: [
          {
            title: "Abrir la ficha",
            body: "Haga clic en el lápiz de la fila de la marca.",
          },
          {
            title: "Cambiar solo el nombre",
            body: "Al editar, la dirección de página no sigue al nombre: es intencional. Déjela tal cual para que los enlaces ya compartidos y referenciados sigan funcionando.",
          },
          {
            title: "Guardar",
            body: "El nuevo nombre aparece en todas partes: en la administración de inmediato, y en el sitio público en uno a cinco minutos según la página.",
          },
        ],
      },
      {
        title: "Eliminar una marca correctamente",
        steps: [
          {
            title: "Vaciar las gamas de sus productos",
            body: "Una gama no puede eliminarse mientras tenga un producto vinculado — incluso un producto desactivado. En la página Productos, cambie la gama de esos productos o elimínelos.",
          },
          {
            title: "Eliminar cada gama",
            body: "Despliegue la marca y elimine sus gamas una por una con la papelera. Mientras quede una gama, la eliminación de la marca se rechaza con un mensaje explicativo.",
          },
          {
            title: "Eliminar la marca",
            body: "Haga clic en la papelera de la marca y confirme. La eliminación es definitiva; la marca desaparece de la página pública « Marcas » en unos minutos.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Añadir marca",
        where: "Botón en la parte superior derecha de la pantalla (abre un panel a la derecha)",
        does: "Crea una nueva marca con un nombre y una dirección de página en el sitio.",
        effects: [
          "La marca se guarda en la base de datos; la dirección de página se pasa a minúsculas automáticamente.",
          "Si otra marca ya usa ese nombre o esa dirección, la creación se rechaza con un mensaje — no se crea nada.",
          "La marca aparece de inmediato en la lista y en los contadores de la pantalla.",
          "Aparece en la página pública « Marcas » en cinco minutos como máximo, incluso sin ningún producto (su tarjeta muestra entonces 0 productos), así como en la franja de marcas en movimiento de la página de inicio (si esa sección está activada).",
          "Solo aparece en los filtros del catálogo público cuando al menos un producto activo está vinculado a ella a través de una gama.",
          "Su fila recibe de inmediato su propio botón « + » para crearle gamas; también aparece en la lista de marcas padre cuando edita una gama existente.",
        ],
        severity: "caution",
        undo: "Elimine la marca con la papelera: es posible sin obstáculos mientras no tenga ninguna gama vinculada.",
        audited: true,
        publicImpact: "La marca se vuelve visible en la página pública « Marcas » en unos minutos, incluso vacía.",
      },
      {
        label: "Editar marca (lápiz)",
        where: "Icono de lápiz a la derecha de cada fila de marca",
        does: "Cambia el nombre y/o la dirección de página de la marca.",
        effects: [
          "El nuevo nombre sustituye al anterior en la lista del admin, la página pública « Marcas », la página de la marca, los filtros del catálogo, las fichas de producto y la franja de la página de inicio (con una excepción: el menú de navegación, vea los puntos de atención).",
          "El sitio público se actualiza solo en uno a cinco minutos según la página.",
          "Si cambia la dirección de página, la página de la marca se muda: la dirección antigua muestra « página no encontrada ». Los enlaces ya compartidos y los resultados de Google apuntan al vacío hasta que se actualicen.",
          "Si el nombre o la dirección ya los usa otra marca, la modificación se rechaza con un mensaje.",
        ],
        severity: "caution",
        undo: "Vuelva a abrir la ficha con el lápiz y restablezca el nombre y la dirección anteriores.",
        audited: true,
        publicImpact: "Nombre visible en todo el sitio; un cambio de dirección rompe los enlaces antiguos hacia la página de la marca.",
      },
      {
        label: "Eliminar marca (papelera)",
        where: "Icono de papelera a la derecha de cada fila de marca",
        does: "Elimina la marca de forma definitiva, previa confirmación.",
        effects: [
          "Antes de nada se muestra una ventana de confirmación.",
          "La eliminación se rechaza mientras la marca contenga al menos una gama: un mensaje le pide eliminar primero las gamas.",
          "Como una gama está a su vez protegida mientras tenga productos, una marca que todavía tiene productos nunca puede eliminarse por accidente desde esta pantalla.",
          "Si nada lo impide, la marca se borra definitivamente de la base de datos.",
          "Desaparece de la lista, de los contadores, de la página pública « Marcas » y de la franja de la página de inicio en unos minutos.",
        ],
        severity: "danger",
        undo: "Vuelva a crear una marca con exactamente el mismo nombre y la misma dirección de página: su página pública reaparece idéntica (el nombre y la dirección son los dos únicos datos de la marca que usa el sitio).",
        audited: true,
        publicImpact: "La marca y su página desaparecen del sitio público en unos minutos.",
      },
      {
        label: "Añadir gama (botón « + » verde)",
        where: "Columna Gamas de cada fila de marca (abre una ventana en el centro)",
        does: "Crea una gama vinculada a esa marca — la marca viene prellenada y bloqueada.",
        effects: [
          "La gama se guarda en la base de datos, vinculada a la marca.",
          "Si una gama de la misma marca ya usa esa dirección de página, la creación se rechaza (dos marcas distintas sí pueden tener gamas con el mismo nombre).",
          "La gama aparece en la lista desplegada de la marca y en los contadores.",
          "Pasa a poder elegirse como gama de un producto en la página Productos.",
          "Solo aparece en el filtro « Gamas » del catálogo público cuando al menos un producto activo está vinculado a ella — vacía, es invisible para los clientes.",
        ],
        severity: "safe",
        undo: "Elimine la gama con la papelera: es posible sin obstáculos mientras no tenga ningún producto vinculado.",
        audited: true,
      },
      {
        label: "Editar gama (lápiz)",
        where: "Icono de lápiz en cada fila de gama (marca desplegada)",
        does: "Cambia el nombre, la dirección de página y — solo aquí — la marca padre de la gama.",
        effects: [
          "El nuevo nombre se refleja en los filtros del catálogo y en las fichas de producto en un minuto aproximadamente. La dirección de una gama, en cambio, no se muestra en ningún lugar del sitio: cambiarla no tiene efecto público.",
          "A diferencia de la creación, aquí sí puede cambiarse la marca padre: cambiar de marca mueve la gama Y todos sus productos bajo la otra marca.",
          "Tras un traslado, esos productos cambian de página de marca en el sitio público y de familia en los filtros del catálogo.",
          "Si la dirección de página ya la usa otra gama de la marca elegida, la modificación se rechaza con un mensaje.",
        ],
        severity: "caution",
        undo: "Vuelva a abrir la gama con el lápiz y restablezca los valores anteriores, incluida la marca padre.",
        audited: true,
        publicImpact: "El nombre de la gama alimenta los filtros del catálogo; un cambio de marca padre mueve todos sus productos bajo la otra marca en el sitio.",
      },
      {
        label: "Eliminar gama (papelera)",
        where: "Icono de papelera en cada fila de gama (marca desplegada)",
        does: "Elimina la gama de forma definitiva, previa confirmación.",
        effects: [
          "Antes de nada se muestra una ventana de confirmación.",
          "La eliminación se rechaza mientras al menos un producto esté vinculado a la gama — los productos desactivados también cuentan. Primero hay que cambiar la gama de esos productos o eliminarlos en la página Productos.",
          "Si nada lo impide, la gama se borra definitivamente de la base de datos.",
          "Si era la última gama de la marca, la marca vuelve a poder eliminarse a su vez.",
        ],
        severity: "danger",
        undo: "Vuelva a crear una gama con el mismo nombre y la misma dirección de página, vinculada a la misma marca.",
        audited: true,
      },
    ],
    gotchas: [
      "En esta pantalla no hay logotipo de marca que subir: en la página pública « Marcas », la tarjeta de cada marca se ilustra automáticamente con la foto de uno de sus productos activos. Para cambiar esa imagen, trabaje las fotos de los productos.",
      "La dirección de página (columna « Slug ») se genera sola a partir del nombre al crear, pero deja de seguir al nombre al editar — es intencional, para no romper los enlaces existentes. Evite cambiarla en una marca ya publicada. En una gama, esa dirección es un simple identificador interno: una gama no tiene página propia en el sitio, y los filtros del catálogo se basan en su nombre.",
      "Una marca creada sin productos aparece igualmente en la página pública « Marcas », con « 0 productos » en su tarjeta. Cree la marca, sus gamas y sus productos de una sola vez.",
      "Los filtros del catálogo público solo muestran una marca o una gama si tiene al menos un producto activo. Una gama vacía es invisible para los clientes.",
      "Las eliminaciones son definitivas: no existe ninguna papelera de recuperación. Eso sí, las protecciones bloquean la eliminación de una marca que tiene gamas y de una gama que tiene productos — incluidos los productos desactivados.",
      "El sitio público se actualiza solo: la página « Marcas » en cinco minutos como máximo, la página de una marca y el catálogo en un minuto aproximadamente. No hace falta recargar una y otra vez.",
      "Dos marcas no pueden compartir el mismo nombre ni la misma dirección de página. Dos gamas de la misma marca no pueden compartir la misma dirección, pero dos marcas distintas sí pueden tener gamas con el mismo nombre.",
      "La barra de búsqueda en la parte superior de la pantalla solo filtra lo que muestra la lista: no modifica nada y no toca el sitio público.",
      "El gran menú « Catálogo » de la navegación pública destaca cuatro marcas (Avène, ISDIN, Filorga, Uriage) escritas de forma fija en el código: renombrar una de ellas o cambiar su dirección no actualiza ese menú, y su enlace puede llevar entonces a « página no encontrada ». Avise al desarrollador si una de esas cuatro marcas cambia.",
    ],
  },
]
