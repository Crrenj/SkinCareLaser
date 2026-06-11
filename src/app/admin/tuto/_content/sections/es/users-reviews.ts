import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "users",
    navLabel: "Clientes",
    title: "Clientes — todas las cuentas registradas en el sitio",
    route: "/admin/users",
    intro:
      "Esta página lista a todas las personas que tienen una cuenta en el sitio: los clientes, pero también los miembros del equipo (que son cuentas de cliente con derechos de administración añadidos). De cada uno ve su nombre, su correo electrónico, su teléfono, su idioma preferido, la fecha de creación de la cuenta y su última conexión. Regla de visualización de los nombres: un miembro del equipo aparece con su nombre a mostrar, un cliente con su nombre y apellido. También es aquí donde un super-admin puede dar o quitar el acceso al panel de administración: no se crea una cuenta especial para un empleado, se promueve una cuenta ya registrada en el sitio. Los admins « simples » ven la lista pero no pueden modificar nada.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Clientes — título y ruta de navegación Admin" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Usuarios (página)", hotspot: 1 },
            { w: 4, kind: "kpi", label: "Administradores" },
            { w: 4, kind: "kpi", label: "Con teléfono" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "🔍 Buscar email, nombre, teléfono…", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Usuario · Contacto · Idioma · Creado · Última conexión · Rol", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "button", label: "Hacer admin / Admin (columna Rol)", hotspot: 4 },
            { w: 5, kind: "toolbar", label: "Página 1 · Anterior · Siguiente", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Tarjetas de cifras",
        desc: "Tres contadores: usuarios mostrados, administradores y cuentas con teléfono. Atención: solo cuentan la página mostrada (50 cuentas como máximo), no toda la base de datos.",
      },
      {
        n: 2,
        label: "Búsqueda",
        desc: "Filtra por correo electrónico, nombre, apellido, nombre a mostrar o teléfono, sin distinguir mayúsculas. Escribir le devuelve siempre a la primera página, y la búsqueda solo examina las 50 cuentas de la página mostrada: si la persona no aparece, borre la búsqueda y recorra las páginas con « Siguiente ».",
      },
      {
        n: 3,
        label: "Tabla de cuentas",
        desc: "Una línea por cuenta. El nombre sigue la regla: nombre a mostrar para un miembro del equipo, nombre y apellido para un cliente (un guion si el perfil no tiene ningún nombre). Hacer clic en el correo abre su programa de mensajería; hacer clic en el teléfono abre una conversación de WhatsApp. El idioma « auto » significa que la persona no ha elegido un idioma preferido. « Nunca » en última conexión: la cuenta nunca se ha usado para iniciar sesión (por ejemplo, una cuenta creada en el mostrador por el equipo).",
      },
      {
        n: 4,
        label: "Columna Rol",
        desc: "Si usted es super-admin, aparece un botón en cada línea (salvo en las de los super-admins): « Hacer admin » para un cliente, « Admin » para quitar los derechos a un miembro del equipo. Si es admin simple, solo ve etiquetas « Admin » / « Super-admin » de lectura, o un guion para los clientes.",
      },
      {
        n: 5,
        label: "Paginación",
        desc: "La lista avanza por páginas de 50 cuentas. « Siguiente » se desactiva cuando la página mostrada no está llena: o no hay nada más después, o una búsqueda activa reduce la página — bórrela para poder seguir navegando.",
      },
    ],
    workflows: [
      {
        title: "Encontrar a un cliente y contactarlo",
        steps: [
          {
            title: "Buscar la cuenta",
            body: "Escriba parte de su correo, de su nombre o de su teléfono en el campo de búsqueda. La lista se actualiza a medida que escribe.",
          },
          {
            title: "Ampliar si hace falta",
            body: "La búsqueda solo cubre las 50 cuentas de la página mostrada, y escribir le devuelve siempre a la primera página. Si no sale nada, borre la búsqueda y recorra las páginas con « Siguiente » para localizar la cuenta a simple vista.",
          },
          {
            title: "Contactar",
            body: "Haga clic en su correo para abrir su programa de mensajería, o en su teléfono para abrir directamente una conversación de WhatsApp.",
          },
        ],
      },
      {
        title: "Dar acceso al panel a un nuevo empleado",
        steps: [
          {
            title: "Pedirle que cree una cuenta normal",
            body: "El empleado se registra en el sitio público como cualquier cliente. No existe una cuenta « admin » separada: se añaden derechos a una cuenta existente.",
          },
          {
            title: "Encontrar su cuenta",
            body: "Conectado como super-admin, busque su correo en esta página.",
          },
          {
            title: "Promover",
            body: "Haga clic en « Hacer admin » al final de su línea y confirme en la pequeña ventana. El acceso es inmediato.",
          },
          {
            title: "Verificar",
            body: "El botón de su línea muestra ahora « Admin ». La persona puede abrir el panel de administración desde su próxima navegación, conservando su cuenta de cliente (carrito, reservas, favoritos).",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Hacer admin",
        where: "Botón en la columna « Rol », en la línea de un cliente — visible solo si usted es super-admin",
        does: "Da a esa cuenta el acceso completo al panel de administración, con el rol « Admin ».",
        effects: [
          "Una ventana de confirmación recuerda el correo afectado; no pasa nada si cancela.",
          "La persona accede de inmediato a todo el panel: productos, precios, stock, reservas, ventas, clientes y la contabilidad (incluidos los costos de compra y los márgenes).",
          "Conserva toda su cuenta de cliente: carrito, reservas, favoritos, perfil — no se pierde nada.",
          "Si su perfil tiene un nombre a mostrar, su nombre aparece a partir de ahora bajo ese nombre a mostrar en las listas (regla de visualización de los miembros del equipo); si no, se siguen mostrando su nombre y apellido.",
          "La operación queda anotada en el registro de actividad.",
        ],
        severity: "caution",
        undo: "Haga clic en el mismo botón (ahora « Admin ») para quitar los derechos — todo vuelve a ser como antes.",
        audited: true,
      },
      {
        label: "Admin (quitar los derechos)",
        where: "El mismo botón, en la línea de un miembro del equipo (rol Admin) — visible solo si usted es super-admin",
        does: "Quita a esa cuenta el acceso al panel de administración.",
        effects: [
          "Una ventana de confirmación recuerda el correo afectado; no pasa nada si cancela.",
          "La persona ya no puede abrir el panel de administración desde su próxima navegación.",
          "Su cuenta de cliente queda intacta: puede seguir iniciando sesión en el sitio, reservar, ver su historial.",
          "Imposible sobre usted mismo y sobre un super-admin: el sitio bloquea esos dos casos, aunque insista.",
          "La operación queda anotada en el registro de actividad.",
        ],
        severity: "safe",
        undo: "Haga clic en « Hacer admin » en la misma línea para devolver los derechos.",
        audited: true,
      },
    ],
    gotchas: [
      "Las tres tarjetas de cifras cuentan la página mostrada (50 cuentas como máximo), no el total de todos los registrados.",
      "La búsqueda solo examina las 50 cuentas de la página actual, y escribir le devuelve siempre a la primera página. Mientras haya una búsqueda activa, « Siguiente » suele quedar desactivado: para buscar más allá, borre el texto y recorra las páginas una a una.",
      "Un guion en lugar del nombre significa que el perfil no tiene ni nombre ni nombre a mostrar (el correo, mostrado justo debajo, sigue siendo la referencia fiable).",
      "« Hacer admin » da siempre el rol « Admin » estándar: la persona puede hacerlo todo en el panel, salvo gestionar el equipo de administración. Los cambios de rol (convertir a alguien en super-admin) se hacen en la página « Administradores » del menú, no aquí.",
      "No puede quitarse sus propios derechos ni tocar a otro super-admin — es una protección contra los bloqueos accidentales, no una avería.",
      "Si usted es admin simple, el botón no aparece en absoluto: la gestión de los derechos está reservada a los super-admins.",
      "Esta pantalla no permite ni eliminar una cuenta de cliente ni modificar sus datos: es el cliente quien gestiona su perfil desde su espacio personal en el sitio.",
      "« Nunca » en última conexión es normal para las cuentas creadas por el equipo en el mostrador (el cliente todavía no ha iniciado sesión por sí mismo).",
    ],
  },
  {
    id: "reviews",
    navLabel: "Reseñas",
    title: "Reseñas de productos — moderar lo que publican los clientes",
    route: "/admin/reviews",
    intro:
      "Los clientes conectados pueden dejar una reseña (una nota de 1 a 5 estrellas, más un título y un texto opcionales) al final de cada ficha de producto del sitio. Cada reseña llega aquí con el estado « Pendiente » y permanece invisible para todo el mundo mientras usted no la apruebe. Solo las reseñas aprobadas aparecen en la ficha de producto pública, y solo ellas cuentan en la nota media mostrada (esa nota también se transmite a los motores de búsqueda). La página se abre directamente en el filtro « Pendientes »: es su fila de moderación. Un cliente solo puede tener una reseña por producto.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Reseñas de productos — título y ruta de navegación Admin / Clientes" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "tabs", label: "Todas · Pendientes · Aprobadas · Rechazadas", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "★★★★☆ · estado · Compra verificada · título + texto · producto · autor · fecha", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "button", label: "✓ Aprobar", hotspot: 3 },
            { w: 4, kind: "button", label: "✕ Rechazar", hotspot: 4 },
            { w: 4, kind: "button", label: "🗑 Eliminar", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Filtros por estado",
        desc: "Cuatro pestañas: Todas, Pendientes, Aprobadas, Rechazadas. La página se abre en « Pendientes » — si parece vacía, no es que no haya ninguna reseña: haga clic en « Todas » para verlo todo.",
      },
      {
        n: 2,
        label: "Lista de reseñas",
        desc: "De la más reciente a la más antigua (200 como máximo). Cada línea muestra las estrellas, la etiqueta de estado, la mención « Compra verificada » cuando corresponde, el título y el texto de la reseña, luego el producto en cuestión, el nombre del autor (o « Cliente » si no tiene) y la fecha.",
      },
      {
        n: 3,
        label: "Botón Aprobar (marca de verificación)",
        desc: "Publica la reseña en la ficha de producto del sitio. El botón solo aparece si la reseña no está ya aprobada.",
      },
      {
        n: 4,
        label: "Botón Rechazar (cruz)",
        desc: "Mantiene la reseña fuera del sitio, sin eliminarla. El botón solo aparece si la reseña no está ya rechazada. Sirve también para despublicar una reseña ya aprobada.",
      },
      {
        n: 5,
        label: "Botón Eliminar (papelera)",
        desc: "Borra la reseña para siempre. Una pequeña notificación de confirmación aparece arriba a la derecha de la pantalla con un botón « Eliminar »: si la ignora, no se elimina nada.",
      },
    ],
    workflows: [
      {
        title: "Moderar las reseñas pendientes",
        steps: [
          {
            title: "Abrir la fila",
            body: "La página se abre ya en « Pendientes »: son las reseñas que nadie ve todavía.",
          },
          {
            title: "Leer la reseña",
            body: "Compruebe la nota, el texto y el producto en cuestión. La mención « Compra verificada » indica que ese cliente realmente retiró una reserva que contenía ese producto — se calcula automáticamente, usted no puede modificarla.",
          },
          {
            title: "Decidir",
            body: "Haga clic en la marca de verificación para publicar la reseña en la ficha de producto, o en la cruz para mantenerla fuera del sitio. La línea desaparece enseguida de la fila « Pendientes ».",
          },
          {
            title: "Verificar en el sitio (opcional)",
            body: "La reseña aprobada aparece en la ficha de producto pública al cabo de un minuto aproximadamente, y la nota media del producto se actualiza.",
          },
        ],
      },
      {
        title: "Retirar una reseña ya publicada",
        steps: [
          {
            title: "Filtrar las reseñas publicadas",
            body: "Haga clic en la pestaña « Aprobadas » para ver solo las reseñas actualmente visibles en el sitio.",
          },
          {
            title: "Encontrar la reseña",
            body: "Localice la línea por el nombre del producto, el autor o la fecha.",
          },
          {
            title: "Rechazar en lugar de eliminar",
            body: "Haga clic en la cruz: la reseña sale de la ficha de producto (en menos de un minuto aproximadamente) pero se conserva en el filtro « Rechazadas », por si hubiera que volver a publicarla. La eliminación, en cambio, es definitiva.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Aprobar",
        where: "Botón con marca de verificación al final de cada línea (salvo las reseñas ya aprobadas)",
        does: "Publica la reseña en la ficha de producto del sitio público.",
        effects: [
          "El estado pasa a « Aprobada » y la línea sale de la fila « Pendientes ».",
          "La reseña aparece en la ficha de producto pública al cabo de un minuto aproximadamente (la ficha muestra las 50 reseñas aprobadas más recientes).",
          "La nota entra en la media y en el contador de reseñas mostrados en la ficha de producto; esa media también se transmite a los motores de búsqueda.",
          "El cliente no recibe aviso: no se le envía ninguna notificación.",
        ],
        severity: "caution",
        undo: "Haga clic en « Rechazar » sobre la misma reseña: desaparece del sitio y la media se recalcula.",
        audited: true,
        publicImpact: "La reseña y su nota pasan a ser visibles para todos en la ficha de producto.",
      },
      {
        label: "Rechazar",
        where: "Botón con cruz al final de cada línea (salvo las reseñas ya rechazadas)",
        does: "Mantiene la reseña fuera del sitio público, sin borrarla.",
        effects: [
          "El estado pasa a « Rechazada »: la reseña no es visible en ninguna parte del sitio, ni siquiera para su autor.",
          "Si la reseña estaba aprobada, desaparece de la ficha de producto en menos de un minuto aproximadamente y la nota media se recalcula sin ella.",
          "La reseña sigue pudiéndose consultar aquí en el filtro « Rechazadas » y puede volver a publicarse en cualquier momento.",
          "El cliente no recibe aviso y no puede ver que su reseña fue rechazada.",
        ],
        severity: "caution",
        undo: "Haga clic en « Aprobar » sobre la misma reseña para volver a publicarla.",
        audited: true,
        publicImpact: "Si la reseña estaba publicada, desaparece de la ficha de producto y la media cambia.",
      },
      {
        label: "Eliminar",
        where: "Botón con papelera al final de cada línea, luego botón « Eliminar » en la notificación de confirmación arriba a la derecha",
        does: "Borra definitivamente la reseña de la base de datos.",
        effects: [
          "La reseña desaparece para siempre: nota, título, texto, mención de compra verificada — no hay papelera de recuperación.",
          "Si estaba aprobada, desaparece también de la ficha de producto y la media se recalcula.",
          "Como un cliente solo tiene derecho a una reseña por producto, la eliminación le permite escribir una nueva sobre ese producto.",
          "El cliente no recibe aviso.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "Si la reseña estaba publicada, desaparece de la ficha de producto.",
      },
    ],
    flows: [
      {
        title: "Vida de una reseña de cliente",
        lanes: [
          [
            {
              label: "El cliente escribe una reseña",
              note: "Desde el final de la ficha de producto, conectado a su cuenta. El sitio le responde « Tu reseña se publicará tras la moderación ».",
            },
            {
              label: "Pendiente",
              tone: "warn",
              note: "Invisible para todo el mundo en el sitio. Es la fila que se muestra al abrir esta página.",
            },
            {
              label: "Aprobada",
              tone: "ok",
              note: "Visible en la ficha de producto, contada en la nota media. Puede despublicarse en cualquier momento con « Rechazar ».",
            },
          ],
          [
            {
              label: "Rechazada",
              tone: "warn",
              note: "Oculta del sitio pero conservada aquí. Puede volver a publicarse más adelante con « Aprobar ».",
            },
          ],
          [
            {
              label: "El cliente modifica su reseña",
              tone: "warn",
              note: "Si deja una nueva reseña sobre el mismo producto, esta sustituye a la anterior y vuelve a « Pendiente » — incluso una reseña aprobada desaparece entonces del sitio hasta su próxima validación.",
            },
          ],
          [
            {
              label: "Eliminada",
              tone: "bad",
              note: "Definitivo, sin recuperación posible. El cliente puede luego escribir una nueva reseña sobre ese producto.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "La página se abre en el filtro « Pendientes »: una lista vacía solo significa que no hay nada que moderar — haga clic en « Todas » para ver el conjunto.",
      "Solo las reseñas aprobadas son visibles en el sitio. Una reseña pendiente o rechazada no aparece en ninguna parte, ni siquiera para el cliente que la escribió.",
      "Si un cliente vuelve a dejar una reseña sobre el mismo producto, la nueva versión sustituye a la anterior y vuelve a « Pendiente »: una reseña ya aprobada desaparece entonces del sitio hasta que usted valide la nueva versión.",
      "La mención « Compra verificada » se asigna automáticamente cuando el cliente retiró en la farmacia una reserva que contenía ese producto. Usted no puede ni añadirla ni quitarla.",
      "Tras una aprobación o un rechazo, la ficha de producto pública se actualiza en menos de un minuto aproximadamente — no se preocupe si el cambio no es instantáneo.",
      "Prefiera « Rechazar » antes que « Eliminar » para retirar una reseña: el rechazo tiene vuelta atrás, la eliminación es definitiva. La eliminación también libera el derecho del cliente a escribir una nueva reseña sobre ese producto.",
      "La confirmación de eliminación es una pequeña notificación arriba a la derecha de la pantalla, no una ventana en el centro: si no hace clic en su botón « Eliminar », no se borra nada.",
      "El cliente nunca recibe aviso de una aprobación, un rechazo o una eliminación — no se le envía ningún mensaje.",
      "La lista muestra las 200 reseñas más recientes del filtro elegido.",
      "Eliminar un producto del catálogo borra también todas sus reseñas, definitivamente.",
    ],
  },
]
