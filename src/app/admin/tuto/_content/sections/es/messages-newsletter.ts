import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "messages",
    navLabel: "Tickets",
    title: "Tickets de soporte — los mensajes del formulario de contacto",
    route: "/admin/messages",
    intro:
      "Cuando un visitante completa el formulario de la página Contacto del sitio o el del centro de ayuda, su mensaje llega aquí en forma de «ticket». Cada ticket contiene la dirección de correo de la persona, un asunto y el mensaje completo. Llega con el estado «Abierto» y la prioridad «Normal». Esta pantalla sirve para dar seguimiento a esas solicitudes: detectar las nuevas, leerlas, indicar que se están atendiendo y luego marcarlas como resueltas o cerradas. Importante: el panel no envía ningún correo — para responder al cliente, usted escribe desde el buzón de correo de la farmacia, usando la dirección que aparece en el ticket.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Tickets de soporte — título y ruta de navegación Admin / Operaciones" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "input", label: "🔍 Buscar por asunto, email o contenido…", hotspot: 1 },
            { w: 7, kind: "tabs", label: "Todos · Abiertos · En curso · Resueltos · Cerrados (+ contadores)", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 2, kind: "kpi", label: "Total", hotspot: 3 },
            { w: 2, kind: "kpi", label: "Abiertos" },
            { w: 2, kind: "kpi", label: "En curso" },
            { w: 2, kind: "kpi", label: "Resueltos" },
            { w: 2, kind: "kpi", label: "Cerrados" },
            { w: 2, kind: "kpi", label: "Hoy · 7 días" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "tabs", label: "Categoría: Todas · Error / Técnico · Pedido y reserva · Producto y consejo · Cuenta y acceso · Otro", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "● Asunto · etiquetas de categoría + estado · email · fecha · vista previa del mensaje", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Ventana de detalle: mensaje completo · Prioridad · Marcar en curso · Marcar resuelto · Cerrar ticket · Eliminar", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Búsqueda",
        desc: "Filtra al instante las filas mostradas por asunto, dirección de correo o contenido del mensaje. Atención: solo busca entre los tickets ya mostrados en pantalla, no en toda la base de datos.",
      },
      {
        n: 2,
        label: "Filtros por estado",
        desc: "Cinco pestañas: Todos, Abiertos, En curso, Resueltos, Cerrados. El pequeño número junto a cada pestaña cuenta TODOS los tickets de ese estado en la base de datos. Al hacer clic se recarga la lista.",
      },
      {
        n: 3,
        label: "Tarjetas de cifras",
        desc: "Siete contadores: total, por estado, más «Hoy» (tickets recibidos hoy) y «Esta semana» (últimos 7 días). Solo lectura, se recalculan en cada carga de la página.",
      },
      {
        n: 4,
        label: "Filtro por categoría",
        desc: "Afina la lista mostrada según el tipo de solicitud. Los mensajes del formulario de la página Contacto llegan todos como «Otro»; los del centro de ayuda del sitio llevan la categoría elegida por el visitante (Error, Pedido, Producto, Cuenta u Otro).",
      },
      {
        n: 5,
        label: "Lista de tickets",
        desc: "Los tickets «Abiertos» (nunca atendidos) aparecen resaltados en color con un punto delante del asunto, y su asunto está en negrita. Un icono de alerta (un círculo con un signo de exclamación) aparece a la izquierda del asunto cuando la prioridad es Alta o Urgente. Al hacer clic en una fila se abre la ventana de detalle.",
      },
      {
        n: 6,
        label: "Ventana de detalle",
        desc: "Se abre al hacer clic en un ticket: mensaje completo, dirección de correo de la persona, fecha de envío, menú «Prioridad», botones de cambio de estado («Marcar en curso», «Marcar resuelto», «Cerrar ticket» — el del estado actual está oculto, y no existe un botón para devolver un ticket a «Abierto») y botón «Eliminar». La tecla Escape o un clic fuera cierran la ventana.",
      },
    ],
    workflows: [
      {
        title: "Atender un mensaje recibido del sitio",
        steps: [
          {
            title: "Detectar las novedades",
            body: "Abra la página: los tickets nunca atendidos aparecen resaltados y marcados con un punto. La pestaña «Abiertos» de arriba indica cuántos quedan.",
          },
          {
            title: "Leer el mensaje",
            body: "Haga clic en la fila. La ventana de detalle muestra el mensaje completo, la dirección de correo de la persona y la fecha de envío.",
          },
          {
            title: "Responder al cliente",
            body: "Copie su dirección de correo y responda desde el buzón de correo de la farmacia. El panel no envía correos por sí mismo.",
          },
          {
            title: "Actualizar el estado",
            body: "Haga clic en «Marcar en curso» si el asunto todavía requiere trabajo, o en «Marcar resuelto» una vez enviada la respuesta. La fecha de atención queda entonces registrada en el ticket.",
          },
          {
            title: "Archivar más adelante",
            body: "Cuando el asunto queda cerrado del todo, «Cerrar ticket» lo guarda en el filtro «Cerrados». Sigue pudiendo consultarse.",
          },
        ],
      },
      {
        title: "Señalar una urgencia al equipo",
        steps: [
          {
            title: "Abrir el ticket",
            body: "Haga clic en la fila correspondiente para abrir la ventana de detalle.",
          },
          {
            title: "Subir la prioridad",
            body: "En el menú «Prioridad», elija «Alta» o «Urgente». El guardado es inmediato, no hay ningún botón que confirmar.",
          },
          {
            title: "Verificar en la lista",
            body: "Un icono de alerta aparece delante del asunto (anaranjado para Alta, rojo para Urgente): todo el equipo ve de un vistazo lo que urge.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Cambiar el estado (Marcar en curso · Marcar resuelto · Cerrar ticket)",
        where: "Ventana de detalle de un ticket",
        does: "Hace avanzar el ticket en su ciclo de vida. Existen tres botones (En curso, Resuelto, Cerrado); el del estado actual está oculto. Ningún botón permite devolver un ticket a «Abierto».",
        effects: [
          "El estado del ticket cambia de inmediato y la ventana se cierra.",
          "Las pestañas de filtro, las tarjetas de cifras y el resaltado de la lista se actualizan.",
          "«Marcar resuelto» registra además la fecha y la hora de la atención («Atendido el:») y quién lo hizo; esa mención sigue visible aunque el estado cambie después.",
        ],
        severity: "safe",
        undo: "Abra el ticket y elija otro estado entre «En curso», «Resuelto» y «Cerrado». En cambio, es imposible devolverlo a «Abierto».",
        audited: true,
      },
      {
        label: "Cambiar la prioridad",
        where: "Menú «Prioridad» en la ventana de detalle",
        does: "Clasifica el ticket como Baja, Normal, Alta o Urgente para ayudar al equipo a priorizar.",
        effects: [
          "El guardado es inmediato en cuanto usted elige un valor (no hay botón «Guardar»).",
          "Con Alta o Urgente, un icono de alerta aparece delante del asunto en la lista.",
          "Ningún efecto para el cliente: la prioridad es puramente interna.",
        ],
        severity: "safe",
        undo: "Elija otro valor en el mismo menú.",
        audited: true,
      },
      {
        label: "Eliminar",
        where: "Botón rojo en la ventana de detalle (con solicitud de confirmación)",
        does: "Borra definitivamente el ticket de la base de datos.",
        effects: [
          "El mensaje, la dirección de correo y todo el historial del ticket desaparecen para siempre.",
          "No se envía ningún correo a la persona; por supuesto, puede volver a escribir mediante el formulario del sitio.",
          "Los contadores se actualizan de inmediato.",
        ],
        severity: "danger",
        audited: true,
      },
    ],
    flows: [
      {
        title: "Vida de un mensaje de contacto",
        lanes: [
          [
            {
              label: "Abierto",
              tone: "warn",
              note: "El mensaje acaba de llegar del sitio (formulario de Contacto o centro de ayuda), con la prioridad «Normal». Permanece resaltado en la lista mientras conserve ese estado.",
            },
            {
              label: "En curso",
              note: "Alguien lo está atendiendo. Útil cuando la respuesta requiere una verificación o la opinión de un colega.",
            },
            {
              label: "Resuelto",
              tone: "ok",
              note: "La respuesta fue enviada al cliente. La fecha y el autor de la atención quedan registrados en el ticket.",
            },
            {
              label: "Cerrado",
              note: "Asunto archivado. El ticket sigue pudiendo consultarse en el filtro «Cerrados».",
            },
          ],
          [
            {
              label: "Eliminado",
              tone: "bad",
              note: "Posible en cualquier etapa desde la ventana de detalle. Definitivo: prefiera «Cerrar ticket» para conservar el historial.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "La lista solo muestra los 10 tickets más recientes del estado elegido, mientras que los contadores lo cuentan todo. Si la pestaña «Abiertos» indica 25, solo los 10 últimos son visibles en pantalla.",
      "La búsqueda y el filtro por categoría solo revisan los tickets ya mostrados (es decir, 10 como máximo) — no toda la base de datos.",
      "Los mensajes del formulario de la página Contacto llegan todos con la categoría «Otro»; solo los del centro de ayuda llevan una categoría elegida por el visitante. Esta pantalla no permite cambiar la categoría de un ticket.",
      "El menú «Prioridad» guarda en cuanto usted elige un valor — no hay botón de confirmación.",
      "«Marcar resuelto» fija la fecha «Atendido el» en el ticket; si después lo pasa a «En curso» o lo cierra, esa fecha sigue visible.",
      "El panel no envía ningún correo al cliente, ni al recibir el mensaje, ni al cambiar el estado, ni al eliminar. Toda respuesta pasa por su buzón de correo.",
      "La eliminación es definitiva, sin papelera de recuperación. Para poner orden sin perder nada, use mejor «Cerrar ticket».",
    ],
  },
  {
    id: "newsletter",
    navLabel: "Newsletter",
    title: "Newsletter — la lista de suscriptores",
    route: "/admin/newsletter",
    intro:
      "Esta página lista a las personas que dejaron su dirección de correo en el sitio para recibir la newsletter. Para cada suscriptor, usted ve su idioma, su fecha de suscripción y — punto esencial — si confirmó su suscripción: tras suscribirse, el visitante recibe un correo con un enlace de confirmación válido por 24 horas; mientras no haga clic, la columna «Confirmado» muestra un guion. La pantalla permite buscar a un suscriptor, filtrar por idioma, exportar la lista a un archivo para Excel y retirar a alguien de la lista. Atención: el envío de la newsletter en sí no se hace aquí — se exporta la lista y luego se envía desde una herramienta de e-mailing externa.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Newsletter — título y ruta de navegación Admin" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Total", hotspot: 1 },
            { w: 3, kind: "kpi", label: "FR" },
            { w: 3, kind: "kpi", label: "ES" },
            { w: 3, kind: "kpi", label: "EN" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "input", label: "🔍 Buscar email…", hotspot: 2 },
            { w: 4, kind: "input", label: "Todos los idiomas ▾", hotspot: 3 },
            { w: 3, kind: "button", label: "⬇ Exportar CSV", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Email · Idioma · Suscrito · Confirmado · Eliminar", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "text", label: "«Mostrando máximo 500 filas…» (solo aparece si la lista está llena)", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Tarjetas de cifras",
        desc: "Total de suscriptores mostrados y luego el desglose por idioma (FR, ES, EN). Atención: estas cifras cuentan la selección en pantalla (500 filas como máximo) y cambian cuando usted filtra — no es necesariamente el total absoluto de la lista.",
      },
      {
        n: 2,
        label: "Búsqueda por email",
        desc: "Escriba una parte de una dirección: la lista se recarga desde la base de datos y solo muestra las coincidencias, sin distinguir mayúsculas de minúsculas.",
      },
      {
        n: 3,
        label: "Filtro por idioma",
        desc: "Limita la lista a los suscriptores inscritos en francés, español o inglés. El idioma es el de la página del sitio donde la persona se suscribió.",
      },
      {
        n: 4,
        label: "Botón «Exportar CSV»",
        desc: "Descarga un archivo (que se puede abrir en Excel) con los suscriptores que corresponden a los filtros activos, hasta 1,000 filas. El archivo lleva la fecha del día en su nombre.",
      },
      {
        n: 5,
        label: "Tabla de suscriptores",
        desc: "Una fila por suscriptor, del más reciente al más antiguo. Al hacer clic en la dirección de correo se abre su programa de mensajería. La columna «Confirmado» muestra la fecha de confirmación, o un guion si la persona aún no ha hecho clic en el enlace recibido por correo. El botón «Eliminar» está al final de cada fila.",
      },
      {
        n: 6,
        label: "Aviso de límite",
        desc: "Solo aparece cuando la lista llega a 500 filas: quedan entonces suscriptores sin mostrar — afine la búsqueda o el filtro de idioma para verlos.",
      },
    ],
    workflows: [
      {
        title: "Preparar un envío de newsletter",
        steps: [
          {
            title: "Elegir el idioma",
            body: "Seleccione el idioma de la campaña en el filtro (por ejemplo «Español») para quedarse solo con los suscriptores correspondientes.",
          },
          {
            title: "Exportar la lista",
            body: "Haga clic en «Exportar CSV». El archivo descargado respeta los filtros activos y contiene hasta 1,000 suscriptores.",
          },
          {
            title: "Quedarse con los confirmados",
            body: "En el archivo, descarte las filas cuya columna de confirmación está vacía: esas personas no validaron su suscripción y no se les debe escribir.",
          },
          {
            title: "Enviar desde su herramienta",
            body: "Importe las direcciones restantes en su herramienta de envío de correos. El panel de administración no envía la newsletter por sí mismo.",
          },
        ],
      },
      {
        title: "Retirar a una persona que ya no quiere recibir correos",
        steps: [
          {
            title: "Encontrar al suscriptor",
            body: "Escriba su dirección (o una parte) en el campo «Buscar email…».",
          },
          {
            title: "Eliminar la fila",
            body: "Haga clic en «Eliminar» al final de la fila y luego confirme. El retiro es inmediato y definitivo.",
          },
          {
            title: "Saber qué sigue",
            body: "La persona no recibe ningún mensaje de nuestra parte. Podrá volver a suscribirse en cualquier momento desde el sitio si cambia de opinión.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Exportar CSV",
        where: "Botón arriba a la derecha de la barra de filtros",
        does: "Descarga la lista de suscriptores que corresponden a los filtros activos en un archivo para Excel (hasta 1,000 filas).",
        effects: [
          "El archivo contiene, para cada suscriptor: un identificador interno, la dirección de correo, el idioma, la fecha de suscripción y la fecha de confirmación (vacía si está pendiente).",
          "La dirección IP de los suscriptores nunca se exporta (protección de datos personales).",
          "No se modifica nada en la base de datos — es una simple copia. Eso sí, el archivo contiene direcciones personales: guárdelo en un lugar seguro y no lo difunda fuera de la farmacia.",
        ],
        severity: "caution",
      },
      {
        label: "Eliminar",
        where: "Botón rojo al final de cada fila de la tabla (con solicitud de confirmación)",
        does: "Retira definitivamente al suscriptor de la lista de difusión.",
        effects: [
          "La fila se borra de la base de datos: dirección, idioma, fechas de suscripción y de confirmación desaparecen para siempre.",
          "No se envía ningún correo a la persona para informarle.",
          "Puede volver a suscribirse por sí misma en cualquier momento desde el sitio (pasará de nuevo por el correo de confirmación).",
          "Las tarjetas de cifras se actualizan de inmediato.",
        ],
        severity: "danger",
        audited: true,
      },
    ],
    flows: [
      {
        title: "Recorrido de un suscriptor",
        lanes: [
          [
            {
              label: "Suscripción en el sitio",
              note: "El visitante deja su dirección en el formulario de newsletter del sitio. Aparece de inmediato en la lista.",
            },
            {
              label: "Correo de confirmación",
              tone: "warn",
              note: "Se le envía un correo con un enlace. El enlace es válido por 24 horas. Mientras tanto, la columna «Confirmado» muestra un guion.",
            },
            {
              label: "Confirmado",
              tone: "ok",
              note: "La persona hizo clic en el enlace: la fecha aparece en la columna «Confirmado». Ya puede recibir la newsletter.",
            },
          ],
          [
            {
              label: "Sin clic en 24 horas",
              tone: "warn",
              note: "La suscripción queda pendiente. Si la persona se suscribe de nuevo con la misma dirección, el sitio le reenvía automáticamente un nuevo enlace de confirmación.",
            },
          ],
          [
            {
              label: "Retirado de la lista",
              tone: "bad",
              note: "Mediante el botón «Eliminar» de esta pantalla, o por la propia persona desde su cuenta de cliente. Definitivo, pero volver a suscribirse sigue siendo posible.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Las tarjetas de cifras cuentan lo que se muestra en pantalla (500 filas como máximo), no necesariamente toda la lista — y cambian en cuanto usted filtra.",
      "La lista se detiene en 500 filas (un mensaje lo señala abajo). La exportación, en cambio, llega hasta 1,000 filas.",
      "La exportación respeta los filtros activos: para exportar a todo el mundo, vacíe la búsqueda y vuelva a poner «Todos los idiomas» antes de hacer clic.",
      "Un guion en la columna «Confirmado» significa que la persona no validó su suscripción: no le envíe la newsletter.",
      "La eliminación es inmediata, definitiva y silenciosa (ningún correo a la persona). No hay papelera de recuperación.",
      "Algunas suscripciones quedan confirmadas de entrada, sin correo: es el caso cuando un cliente conectado se vuelve a suscribir desde su cuenta, o si el envío de correos no está configurado en el sitio.",
      "Esta pantalla solo sirve para gestionar la lista: la redacción y el envío de la newsletter se hacen en una herramienta externa, a partir del archivo exportado.",
    ],
  },
]
