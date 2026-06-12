import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "admins",
    navLabel: "Administradores",
    title: "Administradores — gestionar el equipo que tiene acceso al panel",
    route: "/admin/admins",
    intro:
      "Esta página lista el equipo de administración de la farmacia. Existen dos roles: « Admin » puede hacer todo en el panel (productos, stock, reservas, contabilidad…) excepto gestionar el equipo; « Super-admin » puede además añadir o retirar miembros y cambiar su rol. Importante: un administrador no es una cuenta aparte — es una cuenta de cliente normal del sitio a la que se le añadieron permisos. Conserva todo su lado de cliente (carrito, reservas, favoritos, perfil); no se le quita nada. Cualquier miembro del equipo puede consultar esta página y modificar los seudónimos (el lápiz); en cambio, solo los super-admins ven los botones de gestión y la zona « Añadir un administrador ». Si usted es admin simple, un aviso se lo recuerda: « Solo un super-admin puede gestionar el equipo. »",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Administradores — título y ruta de navegación Admin" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Miembros del equipo", hotspot: 1 },
            { w: 4, kind: "kpi", label: "Super-admins" },
            { w: 4, kind: "kpi", label: "Admins" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Equipo admin — Miembro · Rol · Miembro desde · Acciones", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "button", label: "✏ Lápiz (seudónimo)", hotspot: 3 },
            { w: 4, kind: "button", label: "Super-admin", hotspot: 4 },
            { w: 4, kind: "button", label: "Revocar", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "input", label: "🔍 Añadir un administrador — buscar email, nombre…", hotspot: 6 },
            { w: 4, kind: "button", label: "Buscar" },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "panel", label: "Resultados: cuentas encontradas" },
            { w: 4, kind: "button", label: "Hacer admin", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Tarjetas de cifras",
        desc: "Tres contadores: el tamaño del equipo, el número de super-admins y el número de admins simples. Cubren todo el equipo (la lista no está paginada).",
      },
      {
        n: 2,
        label: "Tabla del equipo",
        desc: "Una línea por miembro, del más antiguo al más reciente. Ve el seudónimo (en su defecto, el nombre y apellido del perfil — un guion solo si el perfil está vacío), el correo electrónico debajo, el rol en una insignia y la fecha de entrada en el equipo. Su propia línea lleva la insignia « Tú ». Las líneas de los super-admins muestran un candado « Protegido » en lugar de los botones de gestión: nadie puede tocar su acceso desde el panel (su seudónimo, en cambio, sigue siendo editable con el lápiz).",
      },
      {
        n: 3,
        label: "Lápiz — editar el seudónimo",
        desc: "Presente en cada línea, para todos los admins. El seudónimo es el nombre con el que un miembro del equipo aparece en todo el panel (listas, registro de actividad…). La marca de verificación guarda, la cruz cancela. Cada cambio queda anotado en el registro de actividad.",
      },
      {
        n: 4,
        label: "Botón Super-admin",
        desc: "Visible únicamente para los super-admins, en las líneas de los admins simples. Promueve al miembro a super-admin tras una ventana de confirmación. Atención: una vez promovido, pasa a « Protegido » — ya nadie podrá degradarlo ni revocarlo desde el panel.",
      },
      {
        n: 5,
        label: "Botón Revocar",
        desc: "Visible únicamente para los super-admins, en las líneas de los admins simples. Retira el acceso al panel tras una ventana de confirmación. La cuenta de cliente de la persona queda intacta.",
      },
      {
        n: 6,
        label: "Añadir un administrador",
        desc: "Zona visible únicamente para los super-admins. Escriba al menos dos caracteres (correo, nombre, apellido, seudónimo o teléfono) y lance la búsqueda: encuentra una cuenta ya registrada en el sitio. Solo recorre las 50 primeras cuentas — si la persona no aparece, pase por la página « Clientes » y sus botones « Siguiente ».",
      },
      {
        n: 7,
        label: "Hacer admin",
        desc: "En cada resultado de búsqueda que no sea ya admin. Da de inmediato acceso al panel con el rol « Admin ». Las cuentas que ya son miembros muestran « Ya es admin » en su lugar.",
      },
    ],
    workflows: [
      {
        title: "Dar acceso al panel a un nuevo empleado",
        steps: [
          {
            title: "Pedirle que cree una cuenta normal",
            body: "El empleado se registra en el sitio público como cualquier cliente. No existe una cuenta « admin » separada: se añaden permisos a una cuenta existente.",
          },
          {
            title: "Buscar su cuenta",
            body: "Conectado como super-admin, escriba su correo o su nombre en la zona « Añadir un administrador » al final de la página y lance la búsqueda.",
          },
          {
            title: "Hacerlo admin",
            body: "Haga clic en « Hacer admin » en su línea. El acceso es inmediato y la persona aparece enseguida en la tabla del equipo.",
          },
          {
            title: "Ponerle un seudónimo",
            body: "Haga clic en el lápiz de su nueva línea y escriba el nombre con el que el equipo lo verá en todo el panel (por ejemplo, su nombre de pila).",
          },
        ],
      },
      {
        title: "Retirar el acceso a un miembro que deja el equipo",
        steps: [
          {
            title: "Localizar su línea",
            body: "En la tabla « Equipo admin », encuentre al miembro por su seudónimo o su correo electrónico.",
          },
          {
            title: "Revocar",
            body: "Haga clic en « Revocar » y confirme. Desde su siguiente navegación, el panel queda cerrado para esa persona.",
          },
          {
            title: "Verificar",
            body: "La persona desaparece de la tabla. Su cuenta de cliente sigue funcionando con normalidad (inicio de sesión, reservas, historial), y sus acciones pasadas siguen visibles en el registro de actividad.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Lápiz (editar el seudónimo)",
        where: "En cada línea de la tabla « Equipo admin », junto al nombre — visible para todos los admins",
        does: "Cambia el seudónimo de un miembro del equipo, es decir, el nombre con el que aparece en todo el panel.",
        effects: [
          "El nuevo seudónimo se muestra de inmediato aquí y en todos los lugares donde se nombra a los miembros del equipo (página Clientes, registro de actividad…).",
          "Cualquier admin puede renombrar a cualquier miembro, incluido él mismo y los super-admins — es una simple etiqueta de visualización, no un privilegio.",
          "El seudónimo está limitado a 60 caracteres y no puede quedar vacío.",
          "No toca ni su correo, ni su contraseña, ni su nombre y apellido. En cambio, el seudónimo corresponde al campo « Nombre a mostrar » del perfil: la persona también lo ve en su espacio personal del sitio, y puede modificarlo ella misma allí.",
          "El cambio queda anotado en el registro de actividad, con el nuevo seudónimo y el autor de la modificación.",
        ],
        severity: "safe",
        undo: "Haga clic de nuevo en el lápiz y vuelva a escribir el seudónimo anterior.",
        audited: true,
      },
      {
        label: "Hacer admin",
        where: "En los resultados de la zona « Añadir un administrador » — visible únicamente si usted es super-admin",
        does: "Da a una cuenta ya registrada en el sitio el acceso completo al panel, con el rol « Admin ».",
        effects: [
          "La persona accede de inmediato a todo el panel: productos, precios, stock, reservas, ventas, clientes y la contabilidad (incluidos los costos de compra y los márgenes).",
          "Conserva toda su cuenta de cliente: carrito, reservas, favoritos, perfil — no se pierde nada.",
          "Aparece en la tabla del equipo y su nombre sigue desde entonces la regla de los miembros: el seudónimo primero.",
          "NO puede gestionar el equipo: ese derecho queda reservado a los super-admins.",
          "No se envía ningún mensaje a la persona: avísele usted mismo.",
          "La operación queda anotada en el registro de actividad.",
        ],
        severity: "caution",
        undo: "Haga clic en « Revocar » en su línea de la tabla del equipo — todo vuelve a quedar como antes.",
        audited: true,
      },
      {
        label: "Super-admin (promover)",
        where: "Al final de la línea de un admin simple, en la tabla del equipo — visible únicamente si usted es super-admin",
        does: "Da a un admin el poder de gestionar el equipo: añadir miembros, revocar accesos, promover a otros super-admins.",
        effects: [
          "Una ventana de confirmación recuerda el correo afectado y avisa: « Podrá gestionar el equipo admin. » No pasa nada si usted cancela.",
          "El miembro se convierte enseguida en super-admin y su línea pasa a « Protegido »: los botones de gestión desaparecen (solo queda el lápiz del seudónimo).",
          "A partir de ahí, NADIE puede degradarlo ni revocarlo desde el panel — ni usted, ni otro super-admin. La única vuelta atrás pasa por el técnico, directamente en la base de datos.",
          "Es una protección deliberada: impide que un super-admin expulse a los demás o que el equipo se quede sin nadie al mando.",
          "La operación queda anotada en el registro de actividad.",
        ],
        severity: "danger",
        audited: true,
      },
      {
        label: "Revocar",
        where: "Al final de la línea de un admin simple, en la tabla del equipo — visible únicamente si usted es super-admin",
        does: "Retira a ese miembro el acceso al panel de administración.",
        effects: [
          "Una ventana de confirmación recuerda el correo afectado; no pasa nada si usted cancela.",
          "Desde su siguiente navegación, la persona ya no puede abrir el panel y desaparece de la tabla del equipo.",
          "Su cuenta de cliente queda intacta: puede seguir iniciando sesión en el sitio, reservar y consultar su historial.",
          "Imposible sobre usted mismo y sobre un super-admin: el sitio bloquea ambos casos, aunque insista.",
          "Sus acciones pasadas permanecen en el registro de actividad, bajo su nombre.",
          "La operación queda anotada en el registro de actividad.",
        ],
        severity: "safe",
        undo: "Busque su cuenta en « Añadir un administrador » y haga clic en « Hacer admin » para devolverle el acceso.",
        audited: true,
      },
    ],
    flows: [
      {
        title: "Recorrido de un miembro del equipo",
        lanes: [
          [
            {
              label: "Cliente registrado",
              note: "Una cuenta normal del sitio, creada por la propia persona. Es el punto de partida obligatorio.",
            },
            {
              label: "Admin",
              tone: "ok",
              note: "Acceso a todo el panel, salvo la gestión del equipo. Conserva su cuenta de cliente. Reversible en cualquier momento por un super-admin.",
            },
            {
              label: "Super-admin",
              tone: "warn",
              note: "Gestiona además el equipo. Pasa a « Protegido »: ninguna vuelta atrás posible desde el panel, solo a través del técnico.",
            },
          ],
          [
            {
              label: "Admin revocado",
              tone: "neutral",
              note: "Vuelve a ser un simple cliente del sitio. No se pierde nada del lado cliente, y sus acciones pasadas permanecen en el registro de actividad.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Usted nunca puede modificar su propio acceso (promoverse, degradarse o revocarse): el sitio lo bloquea para evitar que un equipo se quede sin responsable por accidente.",
      "Un super-admin es intocable desde el panel: ni degradación, ni revocación, ni por usted, ni por otro super-admin. Piénselo bien antes de promover — la vuelta atrás exige la intervención del técnico en la base de datos.",
      "El lápiz del seudónimo está abierto a TODOS los admins, en todas las líneas (incluidos los super-admins y usted mismo). Cada cambio de nombre hecho desde esta página queda anotado en el registro de actividad, con su autor. Pero un miembro también puede cambiar su propio seudónimo desde su espacio personal en el sitio — ese cambio no aparece en el registro.",
      "El seudónimo no cambia ni el correo, ni la contraseña, ni el nombre y apellido. Es el campo « Nombre a mostrar » del perfil, que la persona también gestiona ella misma en su espacio personal del sitio: si usted lo modifica aquí, ella lo verá cambiado allá (y viceversa).",
      "La búsqueda « Añadir un administrador » solo recorre las 50 primeras cuentas del sitio. Si la persona no aparece, pase por la página « Clientes »: allí la búsqueda funciona página por página y el botón « Hacer admin » hace lo mismo.",
      "« Hacer admin » siempre da el rol « Admin » estándar. Para confiar la gestión del equipo, hay que hacer clic después en « Super-admin » en su línea.",
      "Nadie recibe un aviso automático de una promoción o de una revocación: no se envía ningún mensaje. Avise usted mismo a la persona.",
      "Dar el acceso admin es dar acceso a la contabilidad completa: costos de compra, márgenes, cifra de ventas. Resérvelo a personas de confianza.",
      "Las fechas « Miembro desde » se muestran en formato español, sea cual sea el idioma del panel.",
    ],
  },
  {
    id: "logs",
    navLabel: "Registro",
    title: "Registro de actividad — quién hizo qué y cuándo",
    route: "/admin/logs",
    intro:
      "El registro de actividad anota automáticamente las creaciones, las modificaciones y las eliminaciones hechas desde el panel de administración: productos, precios, stock, recepciones, pérdidas, reservas, ventas, gastos, promociones, ajustes de la tienda, apariencia, página de inicio, artículos del blog, banners, moderación de reseñas, mensajes, cuentas de clientes creadas desde el panel, eliminaciones de suscriptores de la newsletter, etiquetas, marcas, gamas, imágenes subidas y todo cambio de acceso admin. Cada línea dice quién actuó, cuándo, sobre qué, con un breve resumen. Es una herramienta de transparencia de equipo: ante una duda (« ¿quién cambió este precio? »), la respuesta está aquí. Esta página es de solo lectura: se consulta, no se modifica nada — y ninguna línea puede borrarse desde el panel. A la inversa, las simples consultas nunca se registran: abrir una página, mirar una reserva o la contabilidad no deja rastro. Las acciones de los clientes en el sitio público (reservar, escribir una reseña, suscribirse a la newsletter) tampoco aparecen: el registro cubre lo que se hace en el panel.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Registro de actividad — título y ruta de navegación Admin" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Entidad · Acción · Autor", hotspot: 1 },
            { w: 4, kind: "toolbar", label: "Desde · Hasta (fechas)", hotspot: 2 },
            { w: 3, kind: "toolbar", label: "☑ Solo alto impacto", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Cuándo · Autor · Acción · Entidad · Resumen", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "› Línea desplegada: detalle de los campos modificados", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Página 1" },
            { w: 6, kind: "toolbar", label: "Anterior · Siguiente", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Filtros Entidad, Acción, Autor",
        desc: "Tres menús desplegables. « Entidad » = el tipo de elemento afectado (Producto, Reserva, Stock, Gasto…). « Acción » = Creación, Modificación o Eliminación. « Autor » propone a los miembros actuales del equipo admin. Cada elección recarga la lista y vuelve a la página 1.",
      },
      {
        n: 2,
        label: "Filtros de fechas « Desde » / « Hasta »",
        desc: "Acotan el período mostrado. Atención: los días se cuentan en hora universal, no en hora local — una acción hecha por la noche puede quedar clasificada en el día siguiente. Ante la menor duda, amplíe el período un día por cada lado.",
      },
      {
        n: 3,
        label: "Casilla « Solo alto impacto »",
        desc: "Conserva solo las operaciones sensibles: todo lo que toca el dinero, el stock, los precios, los accesos admin y la configuración de la tienda. Las líneas afectadas llevan además un pequeño escudo naranja en la columna Entidad. Un enlace « Restablecer » aparece en cuanto hay un filtro activo.",
      },
      {
        n: 4,
        label: "Tabla del registro",
        desc: "Del más reciente al más antiguo, 50 líneas por página. Cada línea: la fecha y la hora, el autor (su seudónimo, con el correo debajo), una insignia de acción (Creación en verde, Modificación en gris, Eliminación en rojo), la entidad afectada y un resumen en español. « Sistema » como autor significa que la acción no tiene un autor identificable: acción automática del sitio, o autor cuya cuenta fue eliminada después.",
      },
      {
        n: 5,
        label: "Flecha › — ver los detalles",
        desc: "Cuando una línea lleva una pequeña flecha a la izquierda, haga clic en ella para desplegar el detalle de los campos modificados, presentado en un formato técnico en bruto. Las contraseñas y los archivos nunca figuran ahí, y los textos muy largos se recortan.",
      },
      {
        n: 6,
        label: "Paginación",
        desc: "La lista avanza por páginas de 50 líneas. « Siguiente » se desactiva cuando la página en curso no está llena — ya no hay nada después.",
      },
    ],
    workflows: [
      {
        title: "Averiguar quién modificó un producto o un precio",
        steps: [
          {
            title: "Filtrar por entidad",
            body: "Elija « Producto » en el menú « Entidad ».",
          },
          {
            title: "Acotar el período",
            body: "Si sabe más o menos cuándo ocurrió el cambio, ponga las fechas « Desde » y « Hasta » para acortar la lista.",
          },
          {
            title: "Leer el resumen",
            body: "Cada línea nombra el producto afectado y el autor. La insignia indica si se trata de una creación, una modificación o una eliminación.",
          },
          {
            title: "Desplegar si hace falta",
            body: "Haga clic en la pequeña flecha a la izquierda de la línea para ver exactamente qué campos cambiaron y sus nuevos valores.",
          },
        ],
      },
      {
        title: "Hacer una revisión semanal de las operaciones sensibles",
        steps: [
          {
            title: "Activar « Solo alto impacto »",
            body: "La lista conserva solo lo que toca el dinero, el stock, los precios, los accesos y la configuración.",
          },
          {
            title: "Definir el período",
            body: "Complete « Desde » y « Hasta » con la semana transcurrida.",
          },
          {
            title: "Recorrer por autor",
            body: "Si hace falta, filtre por miembro del equipo con el menú « Autor » para seguir la actividad de cada uno.",
          },
        ],
      },
    ],
    actions: [],
    gotchas: [
      "Las consultas nunca se registran: mirar una página, una reserva o la contabilidad no deja rastro. El registro solo muestra las creaciones, modificaciones y eliminaciones.",
      "Las acciones de los clientes en el sitio público (reservar, escribir una reseña, suscribirse a la newsletter) no aparecen aquí: el registro cubre las acciones hechas desde el panel de administración.",
      "Nada se puede modificar ni borrar en esta página, por nadie — y las líneas no se eliminan automáticamente con el tiempo. El registro sirve precisamente de memoria duradera.",
      "« Sistema » como autor no es una anomalía: es una acción sin autor identificable — automática, o cuyo autor eliminó su cuenta después (sus líneas antiguas se conservan, pero pierden su nombre).",
      "El menú « Autor » solo propone al equipo admin actual. Las líneas de un miembro revocado siguen existiendo y aún muestran su nombre, pero para encontrarlas hay que usar las fechas o la entidad en lugar de ese menú.",
      "Los resúmenes y los nombres de entidades están redactados en español, sea cual sea el idioma elegido para el panel.",
      "« Alto impacto » es una etiqueta que se pone automáticamente en las categorías sensibles (dinero, stock, precios, accesos, configuración). Puede cubrir gestos inofensivos de esas categorías — un simple cambio de seudónimo de admin queda marcado como « alto impacto », por ejemplo.",
      "El detalle desplegado nunca contiene contraseñas ni archivos, y los números de teléfono de los clientes se mantienen fuera de él. Los textos muy largos se recortan.",
      "El registro está diseñado para no bloquear nunca el trabajo: en casos muy raros de avería, una acción puede faltar en el registro aunque sí haya ocurrido.",
      "Todo miembro del equipo (admin o super-admin) puede consultar este registro — incluidas las líneas que conciernen a los demás. Es deliberado: la transparencia es recíproca.",
    ],
  },
]
