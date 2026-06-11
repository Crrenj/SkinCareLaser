import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "reservations",
    navLabel: "Reservas",
    title: "Reservas — la bandeja de entrada de las solicitudes de clientes",
    route: "/admin/reservations",
    intro:
      "Esta pantalla reúne todas las reservas en curso: las realizadas en el sitio web (por un cliente con cuenta o un visitante) y las que usted mismo crea para un cliente que llama por teléfono o se presenta en el mostrador. Aquí es donde contacta al cliente por WhatsApp, confirma su visita y, cuando pasa a pagar y recoger sus productos, marca la reserva como « Entregada ». Las reservas entregadas salen de esta pantalla y pasan a la pantalla Ventas. Importante: reservar NO bloquea el stock — las unidades solo salen del stock en el momento de la entrega en la farmacia. Una reserva web se conserva 24 horas y una reserva manual 30 días; pasado ese plazo sin confirmación, expira sola.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 7, kind: "text", label: "Admin › Operaciones › Reservas" },
            { w: 2, kind: "button", label: "Exportar CSV" },
            { w: 3, kind: "button", label: "+ Nueva manual", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Buscar por referencia, cliente, teléfono…", hotspot: 2 },
            { w: 4, kind: "tabs", label: "Todas · Reservadas · Confirmadas · Canceladas · Expiradas", hotspot: 3 },
            { w: 3, kind: "input", label: "Ordenar por" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "X seleccionadas · Recordatorio WhatsApp · Marcar · Cancelar", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Referencia · Cliente · Artículos · Total · Estado · Fecha", hotspot: 5 },
            { w: 3, kind: "panel", label: "3 iconos de acción por fila", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Paginación (25 por página)" },
            { w: 8, kind: "drawer", label: "Panel de detalle: cliente · productos · total · nota · acciones", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Nueva manual",
        desc: "Abre el panel de creación de una reserva para un cliente que llama o se presenta en el mostrador: identidad del cliente, productos, nota interna.",
      },
      {
        n: 2,
        label: "Búsqueda",
        desc: "Filtra la lista por referencia (FAR-…), nombre, teléfono o email del cliente. Solo busca entre las reservas de la pestaña actual.",
      },
      {
        n: 3,
        label: "Pestañas de estado",
        desc: "Cada pestaña muestra su contador. « Reservadas » = por contactar, « Confirmadas » = cliente avisado, más « Canceladas » y « Expiradas ». « Todas » lo agrupa todo SALVO las ventas entregadas, que viven en la pantalla Ventas.",
      },
      {
        n: 4,
        label: "Barra de acciones por lote",
        desc: "Aparece en cuanto se marca al menos una fila: recordatorio WhatsApp en grupo, avance de estado en grupo (solo si todas las filas marcadas tienen el mismo estado « Reservada » o « Confirmada ») y cancelación en grupo.",
      },
      {
        n: 5,
        label: "La tabla",
        desc: "Una fila por reserva: casilla, referencia, cliente (nombre, teléfono, distintivo de origen Mostrador o Anónimo web), número de artículos, total en pesos, insignia de estado y fecha. Al pulsar la fila se abre el panel de detalle.",
      },
      {
        n: 6,
        label: "Las acciones de fila",
        desc: "De izquierda a derecha: abrir WhatsApp con el mensaje ya redactado (solo si el cliente tiene teléfono), la marca de verificación para pasar al estado siguiente (« Marcar confirmada » y luego « Marcar entregada »), y « … » para abrir el detalle.",
      },
      {
        n: 7,
        label: "El panel de detalle",
        desc: "Se abre a la derecha: datos del cliente (teléfono y email clicables), lista de los productos con su precio (lápiz para ajustar un precio mientras la reserva no esté entregada), total, nota interna con guardado automático, y los botones WhatsApp, estado siguiente y el enlace « Cancelar reserva ».",
      },
    ],
    workflows: [
      {
        title: "Tramitar una reserva recibida del sitio web",
        steps: [
          {
            title: "Abra la pestaña « Reservadas »",
            body: "Es la fila de espera: el contador « sin contactar » en la parte superior de la página le dice cuántas solicitudes esperan. Pulse una fila para abrir el detalle.",
          },
          {
            title: "Verifique los productos en el estante",
            body: "La reserva no bloquea el stock: asegúrese de que los productos solicitados estén realmente disponibles antes de prometer nada al cliente.",
          },
          {
            title: "Contacte al cliente por WhatsApp",
            body: "Pulse el botón verde: WhatsApp se abre con un mensaje ya redactado — referencia, lista de productos y total. Acuerde con él la hora a la que pasará.",
          },
          {
            title: "Marque la reserva como « Confirmada »",
            body: "Una vez que el cliente esté de acuerdo, pulse « Marcar confirmada ». La reserva ya no expirará automáticamente: es su compromiso de guardársela.",
          },
          {
            title: "Cuando pase, marque « Entregada »",
            body: "El cliente paga y se va con sus productos: pulse « Marcar entregada ». El stock se descuenta, la venta entra en la contabilidad del mes y la fila pasa a la pantalla Ventas.",
          },
        ],
      },
      {
        title: "Crear una reserva para un cliente por teléfono",
        steps: [
          {
            title: "Pulse « Nueva manual »",
            body: "Se abre el panel de creación. Una reserva manual se conserva 30 días (en lugar de 24 horas para el sitio web) — usted la gestiona activamente.",
          },
          {
            title: "Identifique al cliente",
            body: "Tres vías: encontrar su cuenta existente, crearle una cuenta exprés (nombre + teléfono), o registrarlo como invitado con al menos un teléfono. Si lo vincula a una cuenta que ya tiene una reserva activa, la creación será rechazada.",
          },
          {
            title: "Añada los productos",
            body: "Escriba al menos dos letras en la búsqueda y pulse el producto: se añade con su precio actual. Puede modificar el precio y la cantidad de cada línea, o añadir una « Línea libre » para un producto fuera de catálogo.",
          },
          {
            title: "Valide con « Crear reserva »",
            body: "Aparece en la pestaña « Reservadas » con el distintivo de origen « Mostrador ». No se envía ningún email para una creación manual — avise usted mismo al cliente.",
          },
        ],
      },
      {
        title: "Conceder un precio preferencial",
        steps: [
          {
            title: "Abra el detalle de la reserva",
            body: "El ajuste de precio solo es posible en una reserva « Reservada » o « Confirmada » — nunca después de la entrega.",
          },
          {
            title: "Pulse el lápiz de la línea de producto",
            body: "En la sección Productos del panel, cada línea tiene un pequeño lápiz. Un campo de entrada sustituye al monto.",
          },
          {
            title: "Escriba el nuevo precio unitario y valide",
            body: "Pulse la marca de verificación (o presione Enter). El total de la reserva se recalcula de inmediato y el cambio queda anotado en el registro de auditoría con el precio anterior y el nuevo.",
          },
          {
            title: "Verifique el nuevo total",
            body: "Ese es el precio que se cobrará y contabilizará en la entrega — el precio mostrado en el sitio web, en cambio, no cambia.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "« Marcar confirmada » (fila, panel o lote « Marcar confirmadas »)",
        where: "Marca de verificación de una fila « Reservada », botón negro del panel, o barra de acciones por lote",
        does: "Pasa la reserva de « Reservada » a « Confirmada »: usted se ha puesto de acuerdo con el cliente.",
        effects: [
          "La insignia de estado pasa a « Confirmada » y la fecha de confirmación queda registrada en la base de datos.",
          "La reserva YA NO expira automáticamente: la cuenta regresiva (24 h para el sitio web, 30 días para una manual) solo se aplica a las reservas « Reservadas ».",
          "El stock no se mueve — solo se descontará en la entrega.",
          "Ningún botón permite volver a « Reservada »: después, la única salida es « Entregada » o la cancelación.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "El cliente con cuenta ve el estado « Confirmada » en su cuenta, página « Historial de compras » (pestaña « Compras »).",
      },
      {
        label: "« Marcar entregada » (fila, panel o lote « Marcar entregadas »)",
        where: "Marca de verificación de una fila « Confirmada », botón negro del panel, o barra de acciones por lote",
        does: "Registra que el cliente pasó a pagar y se llevó sus productos: la reserva se convierte en una venta.",
        effects: [
          "El stock de cada producto se descuenta en la cantidad reservada (nunca por debajo de 0; las líneas libres y los productos con stock ilimitado se ignoran).",
          "El costo promedio de compra del momento queda fijado en cada línea para calcular el margen de esta venta — ya no cambiará, aunque el costo del producto evolucione después.",
          "La venta entra en los ingresos del mes (pantalla Contabilidad) al precio facturado de cada línea.",
          "La fila sale de esta pantalla y pasa a la pantalla Ventas (diario de las ventas entregadas).",
          "Los precios de la reserva quedan bloqueados: ya no es posible ningún ajuste.",
        ],
        severity: "caution",
        undo: "Desde la pantalla Ventas: cancelar la venta vuelve a acreditar automáticamente el stock y la retira de los ingresos.",
        audited: true,
        publicImpact: "La disponibilidad mostrada de los productos baja en el sitio web; el cliente con cuenta ve « Recogida » en su historial de compras.",
        accountingImpact: "Añade la venta a los ingresos del mes y fija el costo que servirá para calcular el margen.",
      },
      {
        label: "« Cancelar reserva » (panel) / « Cancelar » (lote)",
        where: "Enlace subrayado al final del panel de detalle, o barra de acciones por lote",
        does: "Cancela definitivamente la reserva, tras una ventana de confirmación.",
        effects: [
          "El estado pasa a « Cancelada » — la fila sigue visible en la pestaña « Canceladas », no se borra nada.",
          "El stock no se toca: nunca se había descontado (la reserva no estaba entregada).",
          "Es definitivo: ningún botón permite reactivar una reserva cancelada. Si hay que retomarla, cree una nueva con « Nueva manual ».",
          "En lote, cada reserva marcada se cancela una tras otra, tras una sola confirmación.",
          "El cliente NO recibe ningún aviso automático — contáctelo por WhatsApp si es necesario.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "El cliente con cuenta ve « Cancelada » en su espacio, y puede volver a hacer una reserva en el sitio web.",
      },
      {
        label: "Lápiz « Ajustar el precio » de una línea de producto",
        where: "Panel de detalle, sección Productos — visible solo si la reserva está « Reservada » o « Confirmada »",
        does: "Modifica el precio unitario facturado de un producto de ESTA reserva (precio preferencial para un cliente fiel).",
        effects: [
          "El precio de la línea se sustituye (redondeado al centavo) y el total de la reserva se recalcula al instante — línea y total nunca pueden contradecirse.",
          "Se rechaza si la reserva ya está entregada, expirada o cancelada: mensaje « Precio bloqueado ».",
          "El cambio queda anotado en el registro de auditoría como operación de alto impacto, con el precio anterior y el nuevo.",
          "NO cambia el precio de la ficha de producto ni el de las demás reservas: solo afecta a este cliente, en esta reserva.",
          "Ese precio ajustado es el que se cobrará y contabilizará en la entrega.",
        ],
        severity: "caution",
        undo: "Mientras la reserva no esté entregada, vuelva a escribir el precio anterior de la misma manera.",
        audited: true,
        publicImpact: "El cliente con cuenta ve el nuevo total de su reserva en su espacio; el precio mostrado en la tienda no cambia.",
        accountingImpact: "El precio facturado entra tal cual en los ingresos en el momento de la entrega.",
      },
      {
        label: "Nota interna (zona de texto del panel)",
        where: "Panel de detalle, sección « Nota interna · solo equipo FARMAU »",
        does: "Guarda una indicación para el equipo (ej. « El cliente prefiere pagar en efectivo »).",
        effects: [
          "El guardado es automático: aproximadamente un segundo después de su última pulsación, aparece la mención « Guardado ».",
          "La nota nunca es visible para el cliente — ni en el sitio web, ni en los mensajes de WhatsApp, ni en los emails.",
        ],
        severity: "safe",
        undo: "Modifique o borre el texto: se vuelve a guardar solo.",
        audited: true,
      },
      {
        label: "« Nueva manual » → « Crear reserva »",
        where: "Botón en la parte superior derecha de la pantalla, luego botón al final del panel de creación",
        does: "Crea una reserva para un cliente que llama o se presenta en el mostrador, sin pasar por el sitio web.",
        effects: [
          "La reserva nace con el estado « Reservada », con el distintivo de origen « Mostrador », y se conserva 30 días antes de expirar automáticamente.",
          "Los precios introducidos en el panel quedan fijados tal cual en la reserva (puede modificarlos línea por línea antes de validar).",
          "El stock no se toca en la creación — solo bajará en la entrega.",
          "Si vincula la reserva a una cuenta de cliente que ya tiene una reserva activa, la creación se rechaza: « Este cliente ya tiene una reserva activa. »",
          "No se envía ningún email de confirmación para una creación manual (a diferencia de las reservas hechas en el sitio web).",
          "El botón permanece desactivado mientras no haya al menos un producto y una identidad de cliente válida (el invitado exige al menos un teléfono).",
        ],
        severity: "caution",
        undo: "Cancele la reserva creada: quedará listada en « Canceladas ».",
        audited: true,
      },
      {
        label: "« Abrir WhatsApp » / « Recordatorio WhatsApp » (lote)",
        where: "Botón verde de una fila, del panel, o de la barra de acciones por lote",
        does: "Abre WhatsApp hacia el cliente con un mensaje ya redactado: referencia, lista de productos y total.",
        effects: [
          "No registra nada: ni el estado ni la reserva cambian — le corresponde a usted enviar el mensaje y luego marcar « Confirmada ».",
          "El botón solo aparece si la reserva tiene un número de teléfono.",
          "En lote, se abre una pestaña de WhatsApp por CADA reserva marcada que tenga teléfono — el navegador puede bloquear estas ventanas: autorícelas si no se abre nada.",
        ],
        severity: "safe",
      },
    ],
    flows: [
      {
        title: "El ciclo de vida de una reserva",
        lanes: [
          [
            {
              label: "Reservada",
              tone: "neutral",
              note: "Llega la solicitud (sitio web o manual). El stock no se bloquea. Si viene del sitio web y el cliente dejó un email, recibe un resumen con un botón de WhatsApp.",
            },
            {
              label: "Confirmada",
              tone: "neutral",
              note: "Usted acordó la visita con el cliente. La reserva ya no expira automáticamente.",
            },
            {
              label: "Entregada",
              tone: "ok",
              note: "El cliente pagó y se llevó sus productos: stock descontado, costo fijado para el margen, venta contabilizada. La fila pasa a la pantalla Ventas.",
            },
          ],
          [
            {
              label: "Reservada",
              tone: "neutral",
              note: "Sin confirmación a tiempo (24 h para el sitio web, 30 días para una manual)…",
            },
            {
              label: "Expirada",
              tone: "bad",
              note: "Paso automático, verificado cada 15 minutos. El stock nunca se movió. Definitivo — el cliente puede reservar de nuevo.",
            },
          ],
          [
            {
              label: "Reservada o Confirmada",
              tone: "neutral",
              note: "El cliente se echa atrás, o usted desiste…",
            },
            {
              label: "Cancelada",
              tone: "bad",
              note: "Cancelación manual, definitiva. El stock queda intacto (solo baja en la entrega).",
            },
          ],
          [
            {
              label: "Entregada",
              tone: "ok",
              note: "Venta ya contabilizada, visible en la pantalla Ventas.",
            },
            {
              label: "Cancelada (desde la pantalla Ventas)",
              tone: "warn",
              note: "El stock se vuelve a acreditar automáticamente y la venta sale de los ingresos del mes.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Reservar no bloquea el stock: solo baja en el momento de la entrega. El último ejemplar de un producto puede, por tanto, prometerse a dos clientes — verifique el estante antes de confirmar.",
      "Solo las reservas « Reservadas » expiran automáticamente (24 h para el sitio web, 30 días para una manual, verificación cada 15 minutos). Una reserva « Confirmada » nunca desaparece sola: le corresponde a usted entregarla o cancelarla.",
      "« Cancelada » y « Expirada » son estados definitivos: ningún botón permite reactivar. Si hay que retomar la solicitud, vuelva a crear una reserva con « Nueva manual ».",
      "El email de confirmación al cliente solo aplica a las reservas hechas en el SITIO WEB con una dirección de email conocida, y solo si la clave de envío de emails está configurada — si no, no sale nada, sin mensaje de error. Una creación manual nunca envía email: avise usted mismo al cliente.",
      "El precio ajustado con el lápiz solo vale para esa reserva: la ficha de producto y las demás reservas conservan su precio. Después de la entrega, los precios quedan bloqueados (mensaje « Precio bloqueado »).",
      "La pestaña « Todas » no incluye las ventas entregadas: viven en la pantalla Ventas. Solo el contador « totales » en la parte superior de la página cuenta toda la base, ventas entregadas incluidas.",
      "La búsqueda solo busca en la pestaña actual: para buscar en todas partes, colóquese primero en « Todas ».",
      "El botón « Exportar CSV » aún no está activo — muestra « Exportación CSV próximamente ».",
      "El « Recordatorio WhatsApp » en lote abre una pestaña por cliente: si no se abre nada, probablemente el navegador está bloqueando las ventanas emergentes.",
      "Las acciones por lote avanzan los estados una reserva a la vez: con una selección grande, deje que la pantalla termine antes de pulsar en otra parte. El botón de avance en grupo solo aparece si todas las filas marcadas tienen el mismo estado, y únicamente para « Reservadas » o « Confirmadas ».",
      "Cancelar una reserva no avisa al cliente: piense en escribirle por WhatsApp.",
      "La nota interna nunca es visible para el cliente, pero toda modificación de una reserva (estado, nota, precio, creación) queda anotada en el registro de auditoría con su nombre.",
    ],
  },
]
