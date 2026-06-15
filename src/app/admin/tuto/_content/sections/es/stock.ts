import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "stock",
    navLabel: "Stock",
    title: "Stock — inventario, entradas, mermas y costo promedio",
    route: "/admin/stock",
    intro:
      "Esta pantalla sigue las cantidades en estante de todos los productos y reúne las cuatro operaciones de inventario de la farmacia: la recepción de una entrega del proveedor, el ajuste de un conteo, la declaración de una merma (producto vencido, dañado, robado) y la inicialización de un producto para el lanzamiento. También muestra el costo de compra y el margen de cada producto. El costo que se usa en todas partes es el costo promedio ponderado: si tiene 10 unidades compradas a 80 pesos y recibe otras 10 a 100 pesos, el costo promedio pasa a ser 90 pesos por unidad. Ese costo promedio sirve para calcular los márgenes, el valor del inventario y el monto de las mermas — y SOLO se actualiza con las entradas de stock. De ahí la regla de oro de la pantalla: una entrega pasa SIEMPRE por la entrada de stock (que suma las unidades y registra el costo), nunca por el ajuste (que sobrescribe la cifra sin avisar nada a la contabilidad).",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Catálogo › Stock" },
            { w: 4, kind: "button", label: "+ Entrada de stock", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "toolbar", label: "Buscar un producto…", hotspot: 2 },
            { w: 5, kind: "tabs", label: "Todos · Normal · Bajo · Sin stock", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Total productos", hotspot: 4 },
            { w: 3, kind: "kpi", label: "Stock normal" },
            { w: 3, kind: "kpi", label: "Stock bajo" },
            { w: 3, kind: "kpi", label: "Sin stock" },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Producto · Stock · Costo · Margen · Estado · Actualizado", hotspot: 5 },
            { w: 3, kind: "panel", label: "4 iconos de acción por fila", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Fondo atenuado" },
            { w: 8, kind: "drawer", label: "Paneles: Entrada · Inicialización · Merma + ventana de Ajuste", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Entrada de stock",
        desc: "Abre el panel de recepción de mercancía, vacío. Ahí añade los productos entregados uno por uno. El « + » de una fila de la tabla abre el mismo panel con el producto ya prellenado.",
      },
      {
        n: 2,
        label: "Búsqueda",
        desc: "Filtra la lista por el nombre del producto. Escriba las palabras con sus tildes exactas: « proteccion » no encontrará « protección ».",
      },
      {
        n: 3,
        label: "Pestañas de estado",
        desc: "Filtran la lista por estado del stock: Todos, Normal, Bajo, Sin stock — cada pestaña muestra su contador. La pestaña Sin stock se pone en rojo cuando está seleccionada.",
      },
      {
        n: 4,
        label: "Las 4 tarjetas de estado",
        desc: "El resumen en cifras: número total de productos, con stock normal (por encima del umbral de stock bajo), con stock bajo (en el umbral o menos, sin contar agotados) y sin stock (0 unidades). El umbral se ajusta en Tienda y reservas → Inventario (10 por defecto).",
      },
      {
        n: 5,
        label: "La tabla",
        desc: "Una fila por producto: nombre y marca, stock en unidades, costo de compra promedio, margen (la parte del precio de venta que queda después del costo — en rojo si el producto se vende con pérdida), indicador de estado y fecha de la última actualización. Un guion « — » en Costo o Margen significa que ninguna entrada ha registrado todavía un costo. Las filas con stock bajo se sombrean en amarillo, las que están sin stock en rojo. Se puede ordenar por Producto y Stock; los encabezados Estado y Actualizado también se pueden pulsar, pero en realidad reordenan la lista por nombre de producto.",
      },
      {
        n: 6,
        label: "Las 4 acciones de fila",
        desc: "De izquierda a derecha: « Inicializar este producto » (portapapeles — el panel de lanzamiento), « Entrada de stock » (+ — entrada con el producto prellenado), « Ajustar inventario » (lápiz — corregir la cifra), « Registrar merma » (paquete con un signo de menos — vencido, dañado, robo).",
      },
      {
        n: 7,
        label: "Paneles y ventana de operación",
        desc: "Cada operación se abre encima de la pantalla: tres paneles a la derecha (entrada, inicialización, merma) y una pequeña ventana central para el ajuste. No se guarda nada hasta que pulse el botón de validación al final.",
      },
    ],
    workflows: [
      {
        title: "Recibir una entrega del proveedor",
        steps: [
          {
            title: "Abra el panel de entrada",
            body: "Pulse « Entrada de stock » arriba a la derecha. Una entrada corresponde a UNA factura del proveedor — si tiene dos facturas, haga dos entradas.",
          },
          {
            title: "Añada los productos entregados",
            body: "Escriba al menos dos letras en la búsqueda del panel y pulse el producto en la lista. Volver a pulsar el mismo producto aumenta su cantidad en una unidad.",
          },
          {
            title: "Ingrese cantidad y costo por línea",
            body: "El costo es el precio pagado al proveedor POR UNIDAD — no el precio de venta. Cada línea debe tener una cantidad de al menos 1 y un costo mayor que 0; si no, el botón de validación queda gris.",
          },
          {
            title: "Complete la factura (recomendado)",
            body: "Despliegue « Datos de compra (606) »: proveedor, RNC, NCF, fecha de factura. La casilla « Precios con ITBIS incluido » viene marcada por defecto. Estos datos alimentan el registro de compras que se entrega a la DGII.",
          },
          {
            title: "Verifique y valide",
            body: "El costo total y el número de unidades se muestran al final. Revise bien las cifras: una vez registrada, la entrada ya no se puede eliminar desde el panel. Pulse « Registrar entrada ».",
          },
        ],
      },
      {
        title: "Declarar productos vencidos o dañados (merma)",
        steps: [
          {
            title: "Encuentre la fila del producto",
            body: "Con la búsqueda o las pestañas, y pulse el icono de paquete con un signo de menos: se abre el panel « Registrar merma / producto vencido ».",
          },
          {
            title: "Ingrese cantidad y motivo",
            body: "Elija el motivo (Vencido, Dañado, Robo / pérdida, Ajuste de conteo) y añada una nota interna si es útil, por ejemplo el número de lote.",
          },
          {
            title: "Verifique el « Costo de la pérdida »",
            body: "El panel muestra el monto que se registrará como gasto: costo promedio × cantidad. Si indica « Costo desconocido », el stock bajará pero NINGÚN gasto entrará en la contabilidad.",
          },
          {
            title: "Valide",
            body: "Pulse « Registrar merma »: las unidades salen del stock y el gasto aparece automáticamente en la pantalla Contabilidad, con la fecha del día.",
          },
        ],
      },
      {
        title: "Inicializar un producto para el lanzamiento",
        steps: [
          {
            title: "Abra el panel de inicialización",
            body: "Pulse el icono de portapapeles en la fila del producto. El panel recuerda su stock y su precio actuales — una insignia « provisional » señala el precio temporal de 100 pesos heredado de la importación del catálogo.",
          },
          {
            title: "Cuente las unidades en estante",
            body: "Ingrese la cantidad realmente contada. Atención: el formulario acepta 0 — si valida con 0 y sin costo, el stock del producto quedará fijado en 0.",
          },
          {
            title: "Añada el costo de compra si lo tiene",
            body: "¿Tiene la factura a mano? Ingrese el costo por unidad: la operación se tratará como una entrada de stock y el margen se conocerá desde la primera venta. Si no, déjelo vacío: el stock simplemente quedará fijado en la cifra contada.",
          },
          {
            title: "Ponga el precio de venta real",
            body: "Si el precio actual es el precio provisional, ingrese el precio real: reemplazará el que se muestra en el sitio (visible en aproximadamente un minuto).",
          },
          {
            title: "Decida la puesta en línea y valide",
            body: "La casilla « Activar producto » viene marcada por defecto — desmárquela si el producto no está listo para venderse. El panel inferior resume el modo aplicado (entrada o ajuste) y el stock final antes de pulsar « Inicializar ».",
          },
        ],
      },
    ],
    actions: [
      {
        label: "« Entrada de stock » → « Registrar entrada » (recepción de mercancía)",
        where: "Botón arriba a la derecha de la pantalla, o icono « + » en una fila (producto prellenado), y luego botón al final del panel",
        does: "Registra la llegada de una entrega del proveedor: las unidades se SUMAN al stock y el costo de compra queda memorizado.",
        effects: [
          "Cada línea (producto, cantidad, costo pagado por unidad) se suma al stock existente — nada se sobrescribe.",
          "El costo promedio ponderado del producto se recalcula: el stock anterior a su costo anterior y las unidades recibidas al costo nuevo se promedian juntos. Si todavía no había costo (o ya no quedaba stock), el costo de la entrega pasa a ser el costo promedio.",
          "Cada línea queda inscrita definitivamente en el historial de compras, que alimenta el registro 606 entregado a la DGII — con proveedor, RNC, NCF y fecha de factura si completó la sección « Datos de compra (606) ». Una entrada = una factura.",
          "Con la casilla « Precios con ITBIS incluido » marcada (por defecto), la contabilidad sabrá separar el impuesto del precio pagado en la exportación de compras; desmárquela para un producto exento.",
          "El botón queda gris mientras cada línea no tenga una cantidad de al menos 1 Y un costo mayor que 0 (un costo en 0 falsearía el costo promedio).",
          "Una vez validada, la entrada ya no se puede eliminar ni modificar desde el panel: la cifra de stock se puede corregir después con un ajuste, pero el costo promedio recalculado y la línea del registro de compras se quedan.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "La disponibilidad mostrada de los productos (en stock / stock bajo / sin stock) se refleja en el sitio en aproximadamente un minuto.",
        accountingImpact: "Alimenta el registro de compras (606) del mes y el valor del inventario; fija el costo promedio que sirve para calcular los márgenes.",
      },
      {
        label: "Lápiz → « Guardar » (ajustar inventario)",
        where: "Icono de lápiz en una fila de la tabla, y luego ventana « Ajustar inventario »",
        does: "Reemplaza la cifra de stock por la cantidad exacta que usted ingresa (conteo, corrección de un error).",
        effects: [
          "La cifra ingresada SOBRESCRIBE la anterior: si el producto mostraba 12 unidades y usted escribe 8, tiene 8 — no 20. Es lo contrario de la entrada de stock, que suma.",
          "No se registra ningún costo y la contabilidad no ve pasar nada: ni compra en el registro 606, ni gasto, ni recálculo del costo promedio.",
          "Úselo solo para hacer coincidir la cifra con la realidad del estante. Nunca para registrar una entrega (la contabilidad quedaría ciega ante esas unidades) ni para declarar productos vencidos (use la merma, que crea el gasto correspondiente).",
        ],
        severity: "caution",
        undo: "Vuelva a abrir la ventana e ingrese de nuevo la cifra anterior.",
        audited: true,
        publicImpact: "La disponibilidad mostrada del producto cambia en el sitio en aproximadamente un minuto; en 0, los clientes ya no pueden reservarlo.",
      },
      {
        label: "« Registrar merma » (vencido, dañado, robado)",
        where: "Icono de paquete con un signo de menos en una fila, y luego panel « Registrar merma / producto vencido »",
        does: "Saca unidades del stock Y registra automáticamente la pérdida como gasto en la contabilidad, al costo promedio.",
        effects: [
          "El stock del producto baja en la cantidad ingresada (nunca por debajo de 0).",
          "Si el costo promedio del producto se conoce, se crea automáticamente un gasto « Mermas y pérdidas » en la contabilidad, con la fecha del día: costo promedio × cantidad. El panel muestra ese monto antes de validar.",
          "Si el costo es desconocido (ninguna entrada ha registrado nunca un costo), el stock baja igualmente pero NO se crea ningún gasto — el resultado del mes no verá esta pérdida.",
          "La merma queda consignada en un registro interno de pérdidas, con el costo congelado del momento, el motivo elegido (Vencido, Dañado, Robo / pérdida, Ajuste de conteo) y su nota.",
          "No toca ni el costo promedio ni el registro de compras: es una salida, no una compra.",
          "Atención: el gasto se calcula sobre la cantidad ingresada, aunque supere el stock mostrado — el stock se detiene en 0, pero el gasto cuenta todas las unidades declaradas.",
        ],
        severity: "caution",
        undo: "Parcialmente: vuelva a subir el stock con « Ajustar inventario » y elimine el gasto correspondiente en la pantalla Contabilidad (papelera de la lista de gastos). La línea del registro interno de pérdidas, en cambio, se queda.",
        audited: true,
        publicImpact: "La disponibilidad mostrada del producto baja en el sitio; en 0, pasa a sin stock y ya no se puede reservar.",
        accountingImpact: "Crea un gasto « Mermas y pérdidas » al costo promedio en el resultado del mes (salvo costo desconocido: ningún gasto).",
      },
      {
        label: "« Inicializar este producto » → « Inicializar »",
        where: "Icono de portapapeles en una fila, y luego panel « Inicializar producto »",
        does: "Prepara un producto para el lanzamiento en una sola operación: stock contado, costo de compra si lo hay, precio de venta y puesta en línea.",
        effects: [
          "Ningún campo es obligatorio: el botón « Inicializar » se activa en cuanto hay al menos una acción útil (cantidad contada, precio ingresado o casilla « Activar producto » marcada). El costo de compra, el precio de venta y la activación son opcionales.",
          "CON un costo de compra: la operación se trata como una ENTRADA DE STOCK — la cantidad se SUMA al stock actual, el costo promedio queda registrado (margen conocido desde la primera venta) y una línea entra al historial de compras (sin factura de proveedor).",
          "SIN costo: la operación se trata como un AJUSTE — el stock queda FIJADO en la cantidad contada (incluido 0), sin nada para la contabilidad; el margen solo se conocerá en el primer reabasto. El panel inferior muestra el modo aplicado y el stock resultante ANTES de validar.",
          "Caso particular: costo ingresado pero cantidad 0 — el stock no se mueve.",
          "Precio de venta: reemplaza el precio mostrado en el sitio (reflejado en aproximadamente un minuto). El campo viene prellenado con el precio actual, salvo si se trata del precio provisional de 100 pesos (señalado con una insignia « provisional »).",
          "Casilla « Activar producto » (marcada por defecto): hace el producto visible y reservable en el sitio público. El icono del ojo de la pantalla Productos permite después volver a ocultarlo (y republicarlo) en cualquier momento.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "Puede cambiar el precio mostrado y poner el producto en línea en el sitio público (visible en aproximadamente un minuto).",
        accountingImpact: "Si se ingresa un costo, la operación entra al historial de compras (606) y fija el costo promedio del producto.",
      },
    ],
    flows: [
      {
        title: "El estado del stock tal como se muestra (tarjetas, pestañas, indicadores)",
        lanes: [
          [
            {
              label: "Normal",
              tone: "ok",
              note: "Por encima del umbral de stock bajo.",
            },
            {
              label: "Stock bajo",
              tone: "warn",
              note: "En el umbral de stock bajo o menos — la fila se sombrea en amarillo. Piense en reabastecer.",
            },
            {
              label: "Sin stock",
              tone: "bad",
              note: "0 unidades — los clientes ya no pueden reservar el producto.",
            },
          ],
        ],
      },
      {
        title: "Entradas y salidas de unidades",
        lanes: [
          [
            {
              label: "Entrada de stock",
              tone: "neutral",
              note: "Las unidades se suman, el costo promedio se recalcula, la compra entra al registro 606.",
            },
            {
              label: "En stock",
              tone: "ok",
              note: "Visible y reservable en el sitio público.",
            },
            {
              label: "Venta entregada",
              tone: "ok",
              note: "El stock baja en el momento de la entrega en farmacia; el costo de ese momento queda congelado en la venta para calcular su margen.",
            },
          ],
          [
            {
              label: "En stock",
              tone: "neutral",
              note: "Producto en estante.",
            },
            {
              label: "Merma declarada",
              tone: "warn",
              note: "Vencido, dañado, robado: las unidades salen inmediatamente del stock.",
            },
            {
              label: "Gasto en contabilidad",
              tone: "bad",
              note: "« Mermas y pérdidas » al costo promedio × cantidad, con la fecha del día.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Entrada ≠ ajuste: es LA distinción de la pantalla. La entrada SUMA las unidades y registra un costo (alimenta la contabilidad); el ajuste SOBRESCRIBE la cifra y no registra nada. Nunca registre una entrega con el ajuste: esas unidades quedarían invisibles para los márgenes y el registro de compras.",
      "Una entrada validada ya no se puede eliminar ni corregir desde el panel: revise cantidades y costos ANTES de pulsar « Registrar entrada ». Si hay un error, solo la cifra de stock se puede arreglar con un ajuste — el costo promedio y la línea del registro de compras se quedan.",
      "El ajuste nunca toca el costo promedio: si corrige grandes cantidades a mano, el valor del inventario y los márgenes pueden alejarse de la realidad. Prefiera las entradas para todo lo que sea una compra real.",
      "Merma: el gasto se valora sobre la cantidad ingresada, incluso por encima del stock mostrado (el stock se detiene en 0, el gasto lo cuenta todo). Verifique la cantidad antes de validar.",
      "Merma de un producto sin costo conocido: el stock baja pero no se crea ningún gasto — la pérdida no aparecerá en el resultado del mes. El panel lo señala con « Costo desconocido ».",
      "En el panel de inicialización, la casilla « Activar producto » viene MARCADA por defecto: desmárquela si el producto no está listo. Podrá publicarlo (o volver a ocultarlo) más tarde con el icono del ojo de la pantalla Productos.",
      "La cifra de stock no se mueve cuando un cliente reserva: solo baja cuando la reserva se marca como « Entregada » en farmacia (pantalla Reservas).",
      "El costo ingresado en la entrada es el precio pagado al proveedor POR UNIDAD, con impuestos incluidos por defecto (casilla « Precios con ITBIS incluido ») — no el precio de venta.",
      "Las columnas Costo y Margen solo se ven en el panel de administración, nunca en el sitio público. Un margen en rojo significa que el producto se vende más barato que su costo de compra.",
      "La búsqueda de la lista es sensible a las tildes (« proteccion » no encuentra « protección ») y el umbral de « Stock bajo » se ajusta en Tienda y reservas → Inventario (10 por defecto, mínimo 2).",
    ],
  },
]
