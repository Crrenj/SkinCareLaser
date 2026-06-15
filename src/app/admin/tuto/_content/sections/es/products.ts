import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "products",
    navLabel: "Productos",
    title: "Productos — las fichas del catálogo",
    route: "/admin/product",
    intro:
      "Esta pantalla es el corazón del catálogo: la lista de todas las fichas de producto de la farmacia, con marca, etiquetas, precio y stock. Aquí es donde crea una ficha, corrige un nombre, un precio, una foto o una descripción, y donde elimina un producto. Tenga en cuenta que casi todo lo que guarda aquí se ve en el sitio público en aproximadamente un minuto. La puesta en línea de un producto oculto, en cambio, no se hace aquí: es una acción voluntaria, agrupada con el inventario en la pantalla Stock.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Catálogo › Productos" },
            { w: 4, kind: "button", label: "+ Añadir producto", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "Buscar por nombre, SKU…", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Producto · Marca · Etiquetas · Precio · Stock · Estado", hotspot: 3 },
            { w: 3, kind: "panel", label: "Lápiz · Papelera", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "text", label: "Página 1 de 36" },
            { w: 5, kind: "tabs", label: "1 2 3 …", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "text", label: "Fondo atenuado" },
            { w: 7, kind: "drawer", label: "Panel « Nuevo producto / Editar »", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Añadir producto",
        desc: "Abre el panel lateral « Nuevo producto » a la derecha. No se crea nada hasta que pulse « Crear producto » al final del panel.",
      },
      {
        n: 2,
        label: "Búsqueda",
        desc: "Filtra la lista por el nombre y la descripción del producto (a pesar de la mención « SKU » del campo). La lista vuelve automáticamente a la página 1. Escriba las palabras con sus tildes exactas: « proteccion » no encontrará « protección ».",
      },
      {
        n: 3,
        label: "La lista de productos",
        desc: "Cada fila muestra la foto, el nombre y la dirección de la página, la marca, hasta 3 etiquetas (luego un contador « +n »), el precio en pesos, el stock en unidades y un indicador del estado del stock: Normal, Stock bajo (fila sombreada en amarillo) o Sin stock (fila sombreada en rojo). 10 productos por página, los más recientes primero. Atención: los productos fuera de línea (ocultos al público) también figuran en esta lista — marcados con una etiqueta « Fuera de línea » y una fila atenuada.",
      },
      {
        n: 4,
        label: "Lápiz y papelera",
        desc: "Al final de la fila: el lápiz abre la ficha ya rellenada para modificarla; la papelera pide una confirmación y luego elimina el producto definitivamente.",
      },
      {
        n: 5,
        label: "Paginación",
        desc: "Al pie de la lista: « Página X de Y » y botones numerados para cambiar de página.",
      },
      {
        n: 6,
        label: "El panel de la ficha de producto",
        desc: "El formulario de creación y de modificación, en 4 bloques: Información (nombre, dirección de la página, imagen PNG, descripción corta), Inventario (precio de venta en pesos, stock), Marca y gama (la gama se desbloquea tras elegir la marca) y las etiquetas del producto. Abajo: « Cancelar » y « Guardar » o « Crear producto ». La mención « Sin guardar » recuerda que nada queda guardado hasta que valide.",
      },
    ],
    workflows: [
      {
        title: "Crear un nuevo producto",
        steps: [
          {
            title: "Abra el formulario",
            body: "Pulse « Añadir producto » arriba a la derecha. Se abre el panel « Nuevo producto ».",
          },
          {
            title: "Escriba el nombre",
            body: "La dirección de la página se rellena automáticamente a partir del nombre — retóquela solo si es necesario. Añada una descripción corta si la tiene.",
          },
          {
            title: "Ponga el precio real y el stock",
            body: "El precio de venta en pesos y el stock son obligatorios. No deje un precio provisional: el producto estará en línea desde que lo guarde.",
          },
          {
            title: "Elija marca, gama y etiquetas",
            body: "Si elige una marca sin elegir gama, se asigna automáticamente la primera gama de la marca. Marque las etiquetas (necesidad, tipo de piel…): son ellas las que hacen aparecer el producto en los filtros del catálogo público.",
          },
          {
            title: "Añada la foto",
            body: "Un solo archivo, en formato PNG. Se publicará en el sitio junto con la ficha.",
          },
          {
            title: "Cree y verifique",
            body: "Pulse « Crear producto ». Si otro producto ya tiene la misma dirección de página, el guardado se rechaza: modifíquela y vuelva a intentarlo. La ficha se crea FUERA DE LÍNEA: aún no aparece en el sitio — inicialice su stock (pantalla Stock) o publíquela con el icono del ojo de la lista.",
          },
        ],
      },
      {
        title: "Corregir una ficha (precio, foto, texto)",
        steps: [
          {
            title: "Encuentre el producto",
            body: "Con la búsqueda (palabras con sus tildes exactas) o recorriendo las páginas.",
          },
          {
            title: "Abra la ficha",
            body: "Pulse el lápiz al final de la fila: el panel se abre, ya rellenado.",
          },
          {
            title: "Haga sus cambios",
            body: "Nombre, descripción, precio, stock, marca y gama (para cambiar de marca, elija también una gama — si no, el cambio se ignora sin aviso), etiquetas. Cuidado con la foto: subir una nueva borra TODAS las fotos existentes de la ficha, sin vuelta atrás.",
          },
          {
            title: "Guarde",
            body: "Pulse « Guardar » al final del panel. El sitio público refleja los cambios en aproximadamente un minuto.",
          },
          {
            title: "Caso particular del precio",
            body: "Las reservas ya realizadas conservan el precio anterior, congelado en el momento de la reserva. Solo las nuevas reservas toman el nuevo precio.",
          },
        ],
      },
      {
        title: "Poner a la venta un producto todavía oculto",
        steps: [
          {
            title: "Vaya a la pantalla Stock",
            body: "La puesta en línea no se hace desde la pantalla Productos: está agrupada con el inventario de apertura en la pantalla Stock.",
          },
          {
            title: "Abra « Inicializar este producto »",
            body: "En la fila del producto en cuestión, pulse la acción « Inicializar este producto »: se abre un panel dedicado.",
          },
          {
            title: "Cuente e ingrese las cifras",
            body: "Ingrese la cantidad contada en el estante. Si tiene la factura, añada el costo de compra unitario (el margen se conocerá desde la primera venta). Ingrese también el precio de venta real si hay que reemplazar el precio provisional.",
          },
          {
            title: "Verifique la casilla « Activar producto » y valide",
            body: "La casilla « Activar producto » ya viene marcada al abrir el panel — desmárquela si el producto aún no debe ponerse en línea. Pulse « Inicializar »: el producto se vuelve visible y reservable en el sitio en aproximadamente un minuto, y la operación queda anotada en el registro de actividad.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Añadir producto → « Crear producto »",
        where: "Botón arriba a la derecha de la pantalla, luego botón de validación al final del panel",
        does: "Crea una nueva ficha de producto en el catálogo.",
        effects: [
          "La ficha se guarda en la base de datos pero el producto nace FUERA DE LÍNEA: solo aparece en el catálogo público, en la búsqueda y en su propia página una vez publicado (icono del ojo de la lista o inicialización del stock).",
          "El nombre, el precio (en pesos) y el stock son obligatorios; la dirección de la página se deduce del nombre pero puede modificarse antes de validar.",
          "Si otro producto ya tiene la misma dirección de página, el guardado se rechaza — cámbiela y vuelva a intentarlo.",
          "Marca sin gama elegida: se asigna automáticamente la primera gama de la marca.",
          "La foto (solo PNG) se publica en el espacio de almacenamiento público del sitio; las etiquetas marcadas quedan vinculadas a la ficha.",
          "El stock ingresado aquí se registra tal cual, sin costo de compra ni factura de proveedor: nada alimenta la contabilidad. Para una entrega real, use la entrada de stock de la pantalla Stock.",
        ],
        severity: "caution",
        undo: "Elimine la ficha con el icono de papelera de la lista (eliminación definitiva — sin consecuencias justo después de una creación).",
        audited: true,
        publicImpact: "Ningún impacto inmediato: el producto se crea fuera de línea y permanece invisible para el público hasta que se publique (icono del ojo o inicialización del stock).",
        accountingImpact: "Ningún asiento contable: el stock ingresado aquí no tiene costo de compra ni factura — los márgenes y el registro 606 no ven esas unidades.",
      },
      {
        label: "Lápiz → « Guardar » (modificar una ficha)",
        where: "Icono de lápiz al final de la fila, luego botón « Guardar » al final del panel",
        does: "Actualiza la ficha: nombre, dirección de la página, descripción, precio, stock, marca, gama, foto, etiquetas.",
        effects: [
          "Los campos modificados se escriben en la base de datos; el sitio público los refleja en aproximadamente un minuto.",
          "Cambiar el nombre NO cambia la dirección de la página: conserva su valor original, salvo que usted la modifique (se rechaza si otro producto ya la usa).",
          "Cambiar solo la marca se ignora sin aviso: al modificar, el cambio solo surte efecto si también elige una gama de la nueva marca (a diferencia de la creación, no se asigna ninguna gama automáticamente).",
          "Subir una nueva foto borra primero TODAS las fotos existentes del producto (algunas fichas importadas tienen varias) y luego publica únicamente la nueva. Las antiguas se pierden definitivamente.",
          "Las etiquetas marcadas reemplazan por completo a las anteriores.",
          "Las reservas ya realizadas conservan el precio congelado en el momento de la reserva: solo las futuras toman el nuevo precio.",
          "Modificar la cifra de stock aquí la sobrescribe tal cual, sin costo de compra ni rastro para la contabilidad — para una entrega de proveedor, use la entrada de stock de la pantalla Stock.",
        ],
        severity: "caution",
        undo: "Vuelva a abrir la ficha y reintroduzca los valores anteriores. Excepción: las fotos reemplazadas se borran definitivamente.",
        audited: true,
        publicImpact: "El precio, los textos, la foto y las etiquetas cambian en el sitio público en aproximadamente un minuto.",
        accountingImpact: "Ningún asiento contable: el stock sobrescrito aquí no tiene costo de compra ni rastro en el registro 606, y las ventas pasadas conservan su precio y su costo congelados.",
      },
      {
        label: "Papelera (eliminar un producto)",
        where: "Icono de papelera al final de la fila, con ventana de confirmación",
        does: "Elimina definitivamente la ficha de producto y todo lo que está vinculado a ella.",
        effects: [
          "Una ventana pide confirmación; tras validar, no hay vuelta atrás.",
          "Las fotos del producto se borran del espacio de almacenamiento público y luego la ficha se elimina de la base de datos.",
          "El producto desaparece del sitio público, de los carritos en curso de los clientes (sin avisarles) y de sus listas de favoritos; sus reseñas de clientes se eliminan.",
          "El historial de entradas de stock del producto se borra: las compras correspondientes desaparecen del registro 606 de los meses pasados. El registro de sus pérdidas declaradas también se borra (los gastos ya contabilizados permanecen en la contabilidad).",
          "Las ventas y reservas pasadas se conservan: cada línea guarda el nombre y el precio registrados en el momento de la venta. Los ingresos y los márgenes de los meses pasados no cambian.",
          "Volver a crear el producto a mano da una ficha en blanco: el historial borrado no vuelve.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "El producto desaparece del catálogo, de los carritos en curso y de los favoritos de los clientes.",
        accountingImpact: "Las compras del producto desaparecen del registro 606 de los meses pasados; los ingresos y los márgenes ya registrados quedan intactos.",
      },
      {
        label: "« Activar producto » (puesta en línea)",
        where: "Pantalla Stock → panel « Inicializar este producto » (casilla « Activar ») — o el icono del ojo en la fila de la pantalla Productos",
        does: "Hace que un producto oculto sea visible y reservable en el sitio público.",
        effects: [
          "El producto aparece en el catálogo público, en la búsqueda y en su propia página en aproximadamente un minuto.",
          "Es una acción voluntaria y separada: el formulario de modificación de la pantalla Productos no puede cambiar la visibilidad de un producto.",
          "El panel agrupa todo lo que hay que hacer antes: stock contado, costo de compra si lo tiene, precio de venta real. Atención: la casilla « Activar producto » viene marcada por defecto al abrir el panel — desmárquela si esos puntos aún no están resueltos.",
          "Lo inverso también existe: el icono del ojo de la pantalla Productos oculta un producto en línea en cualquier momento (y lo vuelve a publicar) — cada cambio queda en el registro de auditoría.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "El producto se vuelve visible y reservable para todos los visitantes del sitio.",
      },
    ],
    flows: [
      {
        title: "La vida de una ficha de producto",
        lanes: [
          [
            {
              label: "Creada en esta pantalla",
              tone: "neutral",
              note: "En línea desde que se guarda, sin etapa de revisión.",
            },
            {
              label: "En línea",
              tone: "ok",
              note: "Visible en el catálogo, reservable, presente en la búsqueda.",
            },
            {
              label: "Eliminada",
              tone: "bad",
              note: "Desaparece del sitio, de los carritos y de los favoritos; historial de compras borrado.",
            },
          ],
          [
            {
              label: "Oculta (fuera de línea)",
              tone: "warn",
              note: "Presente en la administración pero invisible al público — a menudo con un precio provisional por corregir.",
            },
            {
              label: "Inicializada — pantalla Stock",
              tone: "neutral",
              note: "Stock contado, costo de compra y precio de venta real establecidos.",
            },
            {
              label: "Puesta en línea",
              tone: "ok",
              note: "Acción voluntaria, anotada en el registro de actividad.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Muchas fichas importadas muestran un precio provisional de 100 pesos puesto al cargar el catálogo. Reemplácelo por el precio de venta real antes de destacar el producto o ponerlo en línea.",
      "Un producto creado desde esta pantalla nace FUERA DE LÍNEA: permanece invisible para el público hasta que se publique (icono del ojo de la lista o inicialización del stock). Aun así, prepare el precio real y el stock correcto antes de publicarlo.",
      "La columna « Estado » indica el estado del stock (Normal / Stock bajo / Sin stock). La visibilidad se lee aparte: un producto fuera de línea lleva una etiqueta « Fuera de línea » y su fila aparece atenuada.",
      "El icono del ojo de cada fila publica o vuelve a ocultar el producto en cualquier momento (cada cambio queda en el registro de auditoría). La puesta en línea también puede hacerse desde la pantalla Stock (panel « Inicializar este producto »).",
      "El formulario solo acepta UNA foto, en formato PNG. Subir una nueva borra todas las fotos existentes de la ficha — incluidas las fichas importadas que tenían varias.",
      "Modificar el stock desde la ficha no registra ni costo de compra ni factura: la contabilidad (márgenes, registro 606) queda ciega ante esas unidades. Para una entrega real, use « Entrada de stock » en la pantalla Stock.",
      "La búsqueda de la lista es sensible a las tildes y se aplica al nombre y a la descripción (no a una referencia interna, a pesar de la mención « SKU » del campo).",
      "El precio tachado y los descuentos que se muestran en el sitio vienen de la pantalla Promociones, no de este formulario: el precio ingresado aquí es el precio base.",
      "Las insignias de « novedad » y « destacado », el consejo del farmacéutico y las características detalladas (contenido, textura…) por ahora no se configuran en ninguna pantalla del panel. La información de filtrado (tipo de piel, necesidad…) pasa por las etiquetas.",
    ],
  },
]
