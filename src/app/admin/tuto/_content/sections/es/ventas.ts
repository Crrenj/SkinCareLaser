import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "ventas",
    navLabel: "Ventas",
    title: "Ventas — el registro de ventas y la venta en mostrador",
    route: "/admin/ventas",
    intro:
      "Esta pantalla es el registro de todo lo que realmente se vendió y se entregó al cliente, sin importar el origen: una reserva hecha en el sitio (con cuenta o como invitado) y luego entregada en la farmacia, o una venta directa en el mostrador. Arriba, cuatro tarjetas muestran los ingresos de hoy, los del mes, el número de ventas del mes y el ticket medio. Aquí también registra una venta en mostrador con el botón « Venta mostrador »: el cliente se lleva la mercancía de inmediato, el stock baja al validar y la venta entra al instante en los ingresos. Cada fila lleva su fecha de retiro; las ventas en mostrador y las ventas de un visitante sin cuenta llevan además un distintivo de origen (« Mostrador », « Anónimo (web) ») — una fila sin distintivo es la de un cliente con cuenta.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Operaciones › Ventas" },
            { w: 4, kind: "button", label: "+ Venta mostrador", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Ingresos hoy", hotspot: 2 },
            { w: 3, kind: "kpi", label: "Ingresos del mes" },
            { w: 3, kind: "kpi", label: "Ventas del mes" },
            { w: 3, kind: "kpi", label: "Ticket medio" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Buscar una venta…", hotspot: 3 },
            { w: 4, kind: "tabs", label: "Todas · Mostrador · Cuenta · Invitado", hotspot: 4 },
            { w: 3, kind: "input", label: "Ordenar por" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "X seleccionadas · Recordatorio WhatsApp · Cancelar", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Referencia · Cliente · Artículos · Total · Estado · Fecha · Acciones", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Paginación (25 por página)" },
            { w: 8, kind: "drawer", label: "Panel: detalle de la venta · nota · anulación", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Venta mostrador",
        desc: "Abre el panel de venta: identidad del cliente (cuenta existente, creación de cuenta exprés o anónimo), productos, nota interna y luego « Registrar venta ».",
      },
      {
        n: 2,
        label: "Tarjetas de ingresos",
        desc: "Ingresos de hoy, ingresos del mes, número de ventas del mes y ticket medio — calculados sobre la fecha de retiro de cada venta. Una venta anulada sale de ellos de inmediato.",
      },
      {
        n: 3,
        label: "Búsqueda",
        desc: "Filtra el registro por referencia (FAR-…), nombre, teléfono o email del cliente, dentro de la pestaña de origen activa.",
      },
      {
        n: 4,
        label: "Pestañas de origen",
        desc: "Todas las filas de aquí son ventas entregadas: las pestañas filtran entonces por origen — Mostrador (registrada por usted), Cuenta (cliente conectado en el sitio), Invitado (visitante del sitio sin cuenta). Cada pestaña muestra su contador.",
      },
      {
        n: 5,
        label: "Barra de acciones por lote",
        desc: "Aparece en cuanto se marca al menos una fila: recordatorio de WhatsApp agrupado (una pestaña por cliente que tenga teléfono) y anulación agrupada de las ventas marcadas.",
      },
      {
        n: 6,
        label: "El registro",
        desc: "Una fila por venta: referencia, cliente (nombre, teléfono y un distintivo « Mostrador » o « Anónimo (web) » cuando la venta no está ligada a una cuenta), número de artículos, total en pesos, estado « Entregada » y la fecha de retiro en la columna Fecha. Al hacer clic en la fila se abre el panel de detalle.",
      },
      {
        n: 7,
        label: "El panel de detalle",
        desc: "Datos de contacto del cliente, lista de productos con sus precios (bloqueados: la venta ya está contabilizada), total, nota interna con guardado automático, botón de WhatsApp y enlace de anulación abajo.",
      },
    ],
    workflows: [
      {
        title: "Cobrar una venta en el mostrador",
        steps: [
          {
            title: "Haga clic en « Venta mostrador »",
            body: "Se abre el panel de venta. Por defecto el cliente es « Anónimo »: perfecto para una venta rápida sin seguimiento.",
          },
          {
            title: "Elija la identidad del cliente (opcional)",
            body: "Tres vías: « Cuenta existente » (búsquelo por nombre o teléfono — la venta entrará en su historial), « Crear cuenta » (nombre + teléfono, el cliente terminará por WhatsApp) o « Anónimo ».",
          },
          {
            title: "Añada los productos",
            body: "Escriba al menos dos letras y haga clic en el producto: se añade al precio actual (promociones incluidas). Ajuste precio y cantidad línea por línea si hace falta, o añada una « Línea libre » para un artículo fuera de catálogo.",
          },
          {
            title: "Valide con « Registrar venta »",
            body: "La venta se cuenta de inmediato como entregada: el stock baja al instante, el costo queda fijado para el margen y la venta entra en los ingresos del día. El botón permanece en gris mientras no haya al menos un producto.",
          },
        ],
      },
      {
        title: "Crear una cuenta exprés para un cliente de paso",
        steps: [
          {
            title: "En el panel de venta, elija « Crear cuenta »",
            body: "Ingrese el nombre y el teléfono (el apellido es opcional). Es todo lo que hace falta en el mostrador — sin email ni contraseña que inventar.",
          },
          {
            title: "Registre la venta",
            body: "La cuenta se crea en el momento de la validación y la venta queda vinculada a ella: aparecerá en el historial del cliente en el sitio.",
          },
          {
            title: "Entregue el enlace de configuración",
            body: "Se muestra una ventana « Cuenta creada » con dos opciones: « Enviar por WhatsApp » (mensaje ya redactado con el enlace) o « Copiar enlace ». Es la única ocasión de recuperar ese enlace — no cierre la ventana sin haberlo entregado.",
          },
          {
            title: "El cliente termina en su casa",
            body: "Al abrir el enlace queda conectado a su cuenta y elige su contraseña y su dirección de email real. A partir de ahí encuentra su historial de compras y puede reservar en el sitio.",
          },
        ],
      },
      {
        title: "Anular una venta registrada por error",
        steps: [
          {
            title: "Encuentre la venta",
            body: "Use la búsqueda (referencia, nombre, teléfono) o las pestañas de origen, y haga clic en la fila para abrir el panel de detalle.",
          },
          {
            title: "Haga clic en el enlace de anulación al pie del panel",
            body: "Una ventana de confirmación recuerda las consecuencias: se restaurará el stock y la línea saldrá del registro.",
          },
          {
            title: "Confirme con « Anular la venta »",
            body: "El stock de los productos se vuelve a acreditar automáticamente y la venta sale de los ingresos. La línea sigue pudiendo consultarse en la pantalla Reservas, pestaña « Canceladas ».",
          },
          {
            title: "Vuelva a registrarla si hace falta",
            body: "Una anulación es definitiva: si fue un error de captura (precio equivocado, producto equivocado), simplemente haga de nuevo una « Venta mostrador » correcta.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "« Venta mostrador » → « Registrar venta »",
        where: "Botón arriba a la derecha de la pantalla, y luego botón al pie del panel de venta",
        does: "Registra una venta inmediata: el cliente paga y se lleva la mercancía, todo queda contabilizado en el acto.",
        effects: [
          "La venta nace directamente con el estado « Entregada », con el distintivo de origen « Mostrador » y la fecha de retiro del momento — aparece de inmediato en el registro.",
          "El stock de cada producto del catálogo baja de inmediato en la cantidad vendida (nunca por debajo de 0; las « líneas libres » y los productos con stock ilimitado no se tocan).",
          "El costo de compra promedio del momento queda fijado en cada línea para calcular el margen de esta venta — ya no cambiará después.",
          "Los precios ingresados en el panel se guardan tal cual y se vuelven definitivos: ningún ajuste de precio es posible después de validar.",
          "Si eligió « Cuenta existente » o « Crear cuenta », la venta queda vinculada a la cuenta del cliente y entra en su historial en el sitio.",
          "El botón permanece en gris mientras no haya al menos un producto válido; en modo venta, la identidad « Anónimo » es suficiente.",
        ],
        severity: "caution",
        undo: "Anule la venta desde el registro: el stock se vuelve a acreditar y la venta sale de los ingresos (la línea anulada sigue visible en Reservas › Canceladas).",
        audited: true,
        publicImpact: "La disponibilidad mostrada de los productos baja en el sitio; si la venta está ligada a una cuenta, el cliente la ve en su historial de compras (pestaña « Compras » de su cuenta).",
        accountingImpact: "Entra de inmediato en los ingresos del día y del mes (tarjetas de arriba y pantalla Contabilidad), con el margen calculado sobre el costo fijado.",
      },
      {
        label: "« Crear cuenta » (sección Cliente del panel de venta)",
        where: "Panel de venta, sección Cliente — segunda pestaña, campos nombre / apellido / teléfono",
        does: "Crea una cuenta de cliente real a partir de un simple nombre y teléfono, en el momento en que valida la venta.",
        effects: [
          "La cuenta se crea ANTES de registrar la venta: si la venta falla después, la cuenta existe de todos modos.",
          "Se asignan automáticamente una dirección de email provisional interna y una contraseña aleatoria — el propio cliente las reemplazará mediante el enlace de configuración.",
          "El perfil del cliente se completa con su nombre, su apellido, su teléfono y el idioma en curso.",
          "Se genera un enlace de configuración y se presenta en la ventana « Cuenta creada », para entregarlo al cliente (WhatsApp o copia).",
          "Si el teléfono ya corresponde a una cuenta, no se crea ningún duplicado: la venta se vincula a la cuenta existente y no se genera ningún enlace.",
          "El teléfono del cliente no se inscribe en el registro de auditoría (dato personal) — solo figuran el nombre y el apellido.",
        ],
        severity: "caution",
        audited: true,
      },
      {
        label: "« Enviar por WhatsApp » / « Copiar enlace » (ventana « Cuenta creada »)",
        where: "Ventana que aparece justo después de registrar una venta con creación de cuenta",
        does: "Entrega al cliente el enlace con el que elegirá su contraseña y su email.",
        effects: [
          "« Enviar por WhatsApp » abre WhatsApp hacia el número ingresado, con un mensaje ya redactado que contiene el enlace; « Copiar enlace » lo pone en el portapapeles.",
          "Nada se guarda en la base de datos: enviar efectivamente el mensaje depende de usted.",
          "El enlace conecta directamente con la cuenta del cliente: entréguelo solo a él.",
          "Una vez cerrada la ventana, el enlace ya no se puede recuperar en ninguna parte del panel de administración — entréguelo antes de cerrar.",
        ],
        severity: "safe",
      },
      {
        label: "« Cancelar reserva » (panel) / « Cancelar » (lote)",
        where: "Enlace subrayado al pie del panel de detalle, o barra de acciones por lote — la ventana de confirmación se titula « Anular venta »",
        does: "Anula definitivamente una venta entregada (error de captura, devolución inmediata).",
        effects: [
          "El estado pasa a « Cancelada »: la línea sale del registro de ventas y sigue pudiendo consultarse en la pantalla Reservas, pestaña « Canceladas ».",
          "El stock de los productos del catálogo se vuelve a acreditar automáticamente con las cantidades vendidas (las líneas libres no se ven afectadas).",
          "La venta sale de los ingresos: las tarjetas de arriba y la pantalla Contabilidad dejan de contarla.",
          "Es definitivo: ningún botón permite volver a registrar una venta anulada — haga una nueva « Venta mostrador » si hace falta.",
          "Por lote, cada venta marcada se anula una tras otra, con una sola confirmación.",
          "El cliente NO recibe ningún aviso automático.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "La disponibilidad de los productos vuelve a subir en el sitio; el cliente con cuenta ve « Cancelada » en su espacio.",
        accountingImpact: "Retira la venta de los ingresos y del margen del mes.",
      },
      {
        label: "Nota interna (zona de texto del panel)",
        where: "Panel de detalle, sección « Nota interna · solo equipo FARMAU »",
        does: "Guarda una indicación para el equipo sobre esta venta (ej. « Pagó en efectivo, pide una factura »).",
        effects: [
          "El guardado es automático: alrededor de un segundo después de su última pulsación aparece la mención « Guardado ».",
          "La nota nunca es visible para el cliente — ni en el sitio ni en los mensajes de WhatsApp.",
        ],
        severity: "safe",
        undo: "Modifique o borre el texto: se vuelve a guardar solo.",
        audited: true,
      },
      {
        label: "« Abrir WhatsApp » / « Recordatorio WhatsApp » (lote)",
        where: "Botón verde de una fila, del panel o de la barra de acciones por lote",
        does: "Abre WhatsApp hacia el cliente con un mensaje ya redactado: referencia, lista de productos y total.",
        effects: [
          "No registra nada: la venta no cambia — útil para un seguimiento después de la compra.",
          "El botón solo aparece si la venta tiene un número de teléfono (una venta anónima no lo tiene).",
          "Por lote, se abre una pestaña de WhatsApp por CADA venta marcada que tenga teléfono — autorice las ventanas emergentes si no se abre nada.",
        ],
        severity: "safe",
      },
    ],
    flows: [
      {
        title: "De dónde vienen las líneas del registro — y cómo salen de él",
        lanes: [
          [
            {
              label: "Venta mostrador",
              tone: "neutral",
              note: "La registra usted aquí: nace ya entregada, el stock baja al validar.",
            },
            {
              label: "Al registro",
              tone: "ok",
              note: "Contada en los ingresos del día y del mes, margen fijado al costo del momento.",
            },
          ],
          [
            {
              label: "Reserva (sitio o manual)",
              tone: "neutral",
              note: "Se gestiona en la pantalla Reservas: contacto por WhatsApp, confirmación…",
            },
            {
              label: "Marcada « Entregada »",
              tone: "neutral",
              note: "El cliente pasó a pagar: stock descontado, costo fijado.",
            },
            {
              label: "Al registro",
              tone: "ok",
              note: "La línea sale de la pantalla Reservas y se une a este registro, en su fecha de retiro.",
            },
          ],
          [
            {
              label: "Al registro",
              tone: "ok",
              note: "Venta contabilizada…",
            },
            {
              label: "Cancelada",
              tone: "warn",
              note: "Stock restaurado automáticamente, venta retirada de los ingresos. La línea pasa a Reservas › Canceladas — definitivo.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Esta pantalla muestra SOLO las ventas entregadas. Las reservas pendientes, confirmadas, expiradas o canceladas viven en la pantalla Reservas.",
      "Una venta en mostrador descuenta el stock de inmediato, a diferencia de una reserva (que solo lo descuenta al entregar). Revise bien el panel antes de validar.",
      "Los precios de una venta son definitivos desde la validación: el lápiz de ajuste no aparece en el panel (solo existe en la pantalla Reservas, mientras el pedido no se haya entregado). Para corregir un precio, anule la venta y regístrela de nuevo.",
      "El precio propuesto al añadir un producto es el precio actual del sitio, promociones incluidas — modificable línea por línea solo ANTES de validar.",
      "Las « líneas libres » (artículos fuera de catálogo) cuentan en el total y en los ingresos, pero nunca tocan el stock y no tienen costo para el margen.",
      "La cuenta exprés se crea antes de la venta: si el registro de la venta falla después, la cuenta existe de todos modos. Si el teléfono ya es conocido, se reutiliza la cuenta existente sin crear duplicados.",
      "La ventana « Cuenta creada » es la única ocasión de entregar el enlace de configuración: si la cierra sin enviarlo ni copiarlo, el enlace se pierde (la cuenta existe pero el cliente no podrá acceder a ella por sí solo).",
      "El enlace de configuración conecta directamente con la cuenta del cliente: envíelo solo al cliente en cuestión, nunca a un tercero.",
      "Anular una venta es definitivo y no avisa al cliente; la línea anulada sigue pudiendo consultarse en Reservas › Canceladas, con su nombre en el registro de auditoría.",
      "Las tarjetas de ingresos se basan en la fecha de retiro: una venta entregada el mes pasado no cuenta en « Ingresos del mes », aunque siga listada más abajo.",
      "Una venta anónima no tiene ni nombre ni teléfono: no hay botón de WhatsApp y solo se identifica por su referencia FAR-…. Anote la referencia si el cliente quiere un seguimiento.",
      "El enlace de anulación al pie del panel se titula « Cancelar reserva » (etiqueta compartida con la pantalla Reservas), pero la confirmación habla claramente de « Anular venta »: es la misma acción.",
    ],
  },
]
