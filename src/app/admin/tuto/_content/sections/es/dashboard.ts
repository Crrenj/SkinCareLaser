import type { TutoSection } from "../../types"

export const sections: TutoSection[] = [
  {
    id: "dashboard",
    navLabel: "Vista general",
    title: "Vista general — el panel de control",
    route: "/admin",
    intro:
      "Es la página de inicio de la administración: llega a ella justo después de iniciar sesión. Muestra toda la farmacia de un vistazo — reservas, ingresos, stock, catálogo, clientes, mensajes — sin modificar nada. Todo es de solo lectura: al hacer clic en una tarjeta o un panel simplemente se abre la página correspondiente. Las cifras se calculan en el momento en que se muestra la página.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Vista general · fecha de hoy", hotspot: 1 },
            { w: 2, kind: "button", label: "+ Producto" },
            { w: 2, kind: "button", label: "Buscar" },
          ],
        },
        {
          blocks: [
            { w: 2, kind: "kpi", label: "Productos", hotspot: 2 },
            { w: 2, kind: "kpi", label: "Reservas" },
            { w: 2, kind: "kpi", label: "¡Stock!", hotspot: 3 },
            { w: 2, kind: "kpi", label: "¡Mensajes!" },
            { w: 2, kind: "kpi", label: "Clientes" },
            { w: 2, kind: "kpi", label: "Carritos" },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "panel", label: "01 · Reservas — gráfico 7 días", hotspot: 4 },
            { w: 4, kind: "panel", label: "Por estado", hotspot: 5 },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "Reservas recientes", hotspot: 6 }],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "02 · Preparación del catálogo", hotspot: 7 },
            { w: 5, kind: "panel", label: "Inventario", hotspot: 8 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "03 · Clientes", hotspot: 9 },
            { w: 4, kind: "panel", label: "Actividad" },
            { w: 4, kind: "panel", label: "Contenido" },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "Accesos rápidos (13 atajos)", hotspot: 10 }],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Encabezado",
        desc: "Ruta de navegación «Admin / Vista general», título con la fecha de hoy y dos botones a la derecha: «Añadir producto» y «Buscar». Ambos llevan a la página Productos; el formulario de creación no se abre solo: una vez allí, haga clic en el botón «Añadir producto» de la página Productos.",
      },
      {
        n: 2,
        label: "Franja de 6 tarjetas",
        desc: "El pulso de la farmacia: productos activos (con el número de marcas y de gamas), reservas activas (pendientes + confirmadas, con el total confirmado en DOP), stock crítico, mensajes sin leer, clientes registrados (con los nuevos de la semana) y carritos en curso. En todas las tarjetas, salvo «Carritos», se puede hacer clic para ir a la página correspondiente.",
      },
      {
        n: 3,
        label: "Anillo de alerta",
        desc: "Cuando algo requiere una acción, el borde de la tarjeta toma un color de alerta rojizo. Dos tarjetas pueden encenderse: «Stock crítico» (al menos un producto activo por debajo de 5 unidades, agotados incluidos) y «Mensajes sin leer» (al menos un mensaje abierto).",
      },
      {
        n: 4,
        label: "Gráfico de reservas (7 días)",
        desc: "Dos curvas: «Reservado» = total de todas las reservas creadas cada día (salvo las canceladas); «Confirmado» = la parte de esas reservas hoy confirmadas o entregadas. Las flechas comparan con la semana anterior, y la tasa de conversión indica qué parte de lo reservado se concreta.",
      },
      {
        n: 5,
        label: "Reservas por estado",
        desc: "Los 5 estados (reservada, confirmada, entregada, expirada, cancelada) con su número y su importe. Encima: el ingreso confirmado (reservas confirmadas + entregadas) y la cesta media — atención, esas dos cifras cubren TODAS las reservas desde la apertura, no solo la semana.",
      },
      {
        n: 6,
        label: "Reservas recientes",
        desc: "Las 5 últimas reservas: referencia, nombre del cliente, origen (cuenta, web sin cuenta o mostrador), estado e importe. Al hacer clic en una línea se abre la página Reservas — la reserva no queda preseleccionada allí: búsquela por su referencia. Las reservas ya entregadas se consultan en la página Ventas.",
      },
      {
        n: 7,
        label: "Preparación del catálogo",
        desc: "Una puntuación media de lo completas que están las fichas de producto, seguida de 7 barras: imagen, precio configurado, volumen, beneficios, consejo del farmacéutico, lista de ingredientes y ficha técnica PDF. Verde = bien cubierto, rojo = casi vacío. Debajo de este panel están también el desglose por marca, el top de productos de los últimos 30 días y la lista del stock crítico.",
      },
      {
        n: 8,
        label: "Inventario",
        desc: "Unidades totales en stock, valor del stock a precio de venta y distribución de los productos: en stock (5 unidades o más), stock bajo (1 a 4) y agotado (0). Un aviso naranja señala los productos que siguen con el precio provisional de 100 DOP, nunca configurado.",
      },
      {
        n: 9,
        label: "Clientes y actividad",
        desc: "Tres paneles: Clientes (total de cuentas, nuevos en 7 y 30 días, proporción con teléfono, idioma preferido), Actividad (carritos con artículos, favoritos, suscritos a la newsletter y confirmados) y Contenido (artículos del blog publicados, banners activos, etiquetas). Más abajo: los 5 últimos mensajes recibidos.",
      },
      {
        n: 10,
        label: "Accesos rápidos",
        desc: "13 atajos hacia las principales secciones de la administración (algunas páginas, como Contabilidad, Promociones o Ventas, no figuran ahí: use el menú de la izquierda). El primero, «Añadir producto», lleva a la página Productos; el formulario de creación se abre desde el botón de esa página.",
      },
    ],
    workflows: [
      {
        title: "Revisar la situación al empezar el día",
        steps: [
          {
            title: "Abrir la Vista general",
            body: "Es la página a la que llega después de iniciar sesión. Deje que cargue por completo: todas las cifras se calculan en ese instante.",
          },
          {
            title: "Leer la franja de tarjetas",
            body: "Localice primero las tarjetas con el borde rojizo: señalan stock crítico o mensajes sin leer pendientes de atender.",
          },
          {
            title: "Atender el stock crítico",
            body: "Haga clic en la tarjeta «Stock crítico» para abrir la página Stock y reabastecer o desactivar los productos afectados.",
          },
          {
            title: "Repasar las reservas recientes",
            body: "Compruebe que ninguna reserva pendiente se quede sin atender: expiran automáticamente a las 24 horas sin acción.",
          },
          {
            title: "Responder los mensajes",
            body: "Haga clic en la tarjeta «Mensajes sin leer» o en un mensaje al pie de la página para abrir la bandeja de entrada (menú «Soporte»).",
          },
        ],
      },
      {
        title: "Comprobar la salud del catálogo",
        steps: [
          {
            title: "Leer la puntuación de preparación",
            body: "El gran porcentaje del panel «Preparación del catálogo» indica lo completas que están, de media, las fichas de producto. Cuanto más verde, más presentable es el catálogo.",
          },
          {
            title: "Identificar lo que falta",
            body: "Cada barra muestra cuántas fichas tienen imagen, precio configurado, volumen, beneficios, consejo, ingredientes o ficha PDF.",
          },
          {
            title: "Vigilar los precios provisionales",
            body: "El recuadro naranja del panel «Inventario» cuenta los productos que siguen a 100 DOP: ese precio de espera se muestra tal cual en el sitio público mientras no se sustituya.",
          },
          {
            title: "Completar las fichas",
            body: "Abra la página Productos (botón «Buscar» o tarjeta «Productos activos») y complete las fichas una a una.",
          },
        ],
      },
      {
        title: "Seguir las ventas de la semana",
        steps: [
          {
            title: "Comparar Reservado y Confirmado",
            body: "En el gráfico, la distancia entre las dos curvas muestra las reservas que todavía no se concretan.",
          },
          {
            title: "Mirar las flechas de tendencia",
            body: "Flecha verde hacia arriba: mejor que la semana anterior. Flecha roja hacia abajo: peor.",
          },
          {
            title: "Identificar los productos que funcionan",
            body: "El panel «Top productos» clasifica los 4 productos más entregados en 30 días, en unidades y en DOP.",
          },
          {
            title: "Abrir el detalle",
            body: "Los enlaces «Ver detalle» y «Ver todas» llevan a la página Reservas para actuar sobre cada reserva.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Añadir producto",
        where: "Encabezado de la página, a la derecha del título",
        does: "Le lleva a la página Productos, donde podrá crear el producto.",
        effects: [
          "Sale del panel de control hacia la página Productos.",
          "El formulario de creación no se abre solo: haga clic en el botón «Añadir producto» de la página Productos.",
          "No se guarda nada mientras no valide ese formulario.",
        ],
        severity: "safe",
        undo: "Vuelva atrás o abra otra página: no se crea ningún dato.",
      },
    ],
    flows: [
      {
        title: "Los estados de reserva tal como se muestran en el panel",
        lanes: [
          [
            {
              label: "En espera («Reservada»)",
              tone: "neutral",
              note: "El cliente acaba de reservar. Sin acción por su parte, la reserva expira sola a las 24 horas.",
            },
            {
              label: "Confirmada",
              tone: "neutral",
              note: "Usted confirmó al cliente que su pedido le espera en la farmacia.",
            },
            {
              label: "Entregada",
              tone: "ok",
              note: "El cliente pasó a recoger: el stock se descuenta en ese momento y la venta entra en contabilidad. Su importe ya contaba en el «ingreso confirmado» desde la confirmación.",
            },
          ],
          [
            { label: "En espera", tone: "neutral" },
            {
              label: "Expirada",
              tone: "warn",
              note: "24 horas sin respuesta: la reserva se cierra automáticamente, sin tocar el stock.",
            },
          ],
          [
            { label: "En espera o confirmada", tone: "neutral" },
            {
              label: "Cancelada",
              tone: "bad",
              note: "La reserva queda cancelada: no cuenta ni en el ingreso confirmado ni en la cesta media.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Los textos del interior de las tarjetas y paneles están en español, sea cual sea el idioma elegido en la parte superior de la página. Solo el menú, la ruta de navegación, el título y los botones del encabezado siguen su idioma.",
      "«Valor stock» es el valor del stock a precio de VENTA (precio × unidades). El valor a precio de costo se consulta en Contabilidad.",
      "La insignia «en promo» cuenta los productos cuya ficha lleva un precio anterior tachado introducido a mano — no las campañas de la página Promociones.",
      "«Top productos» solo cuenta las reservas realmente entregadas en los últimos 30 días. Una reserva pendiente o confirmada pero aún no entregada no aparece ahí.",
      "«Ingreso confirmado» y «cesta media» (panel «Reservas por estado») cubren todas las reservas desde la apertura, no solo los 7 días del gráfico vecino.",
      "Las letras bajo el gráfico (L, M, M, J, V, S, D) no siempre corresponden a los días reales: el gráfico cubre en realidad los últimos 7 días, y el punto más a la derecha es hoy.",
      "El panel de control considera que un precio de exactamente 100 DOP es un precio provisional nunca configurado: eso es lo que cuenta el aviso naranja del panel «Inventario».",
      "Las cifras quedan fijadas en el momento en que se muestra la página. Recargue la página para actualizarlas.",
      "La leyenda de las reservas recientes menciona un marcador 💬 («el cliente abrió WhatsApp»), pero nunca se muestra: esa información no se registra en ningún sitio por el momento.",
    ],
  },
  {
    id: "chrome",
    navLabel: "Navegación general",
    title: "Orientarse: barra lateral y encabezado",
    route: "/admin",
    intro:
      "Dos elementos le acompañan en todas las páginas de la administración: la barra lateral a la izquierda (el menú, con sus contadores y su tarjeta de identidad) y el encabezado en la parte superior de cada página (la ruta de navegación, el título, el selector de idioma y el modo claro/oscuro). Esta sección explica cómo leerlos y qué hacen sus botones.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 3, kind: "panel", label: "FARMAU · Admin", hotspot: 1 },
            { w: 9, kind: "toolbar", label: "Ruta de navegación / Título — FR ES EN · claro/oscuro", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Menú: 6 grupos + insignias", hotspot: 3 },
            { w: 9, kind: "panel", label: "Contenido de la página" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Tarjeta de identidad · cerrar sesión", hotspot: 4 },
            { w: 9, kind: "panel" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Ver el sitio · Mi cuenta", hotspot: 5 },
            { w: 9, kind: "panel" },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Logo y distintivo Admin",
        desc: "En la parte superior de la barra lateral, «FARMAU» siempre vuelve a la Vista general. El distintivo «Admin» recuerda que está en el lado de administración, no en el sitio público.",
      },
      {
        n: 2,
        label: "Encabezado de página",
        desc: "Presente en todas las páginas: la ruta de navegación en versalitas (se puede hacer clic en los elementos anteriores), el título de la página, luego las herramientas — selector de idioma FR/ES/EN y conmutador claro/oscuro — y por último los botones propios de la página (por ejemplo «Añadir producto»).",
      },
      {
        n: 3,
        label: "Menú por grupos",
        desc: "Seis grupos: General (Vista general, Contabilidad, Guía de uso), Catálogo (Productos, Marcas, Stock, Etiquetas, Promociones), Operaciones (Reservas, Ventas, Soporte, Página de inicio, Blog), Clientes (Usuarios, Reseñas, Newsletter), Configuración (Tienda, Apariencia) y Acceso (Administradores, Registro). La página actual queda resaltada con un filete de color a la izquierda. Algunas entradas llevan una insignia: un contador gris en Productos (número de productos activos) e insignias de color vivo en Stock (productos por debajo de 5 unidades), Reservas (pendientes o confirmadas, por atender) y Soporte (mensajes abiertos).",
      },
      {
        n: 4,
        label: "Tarjeta de identidad y cierre de sesión",
        desc: "Al pie del menú: un círculo con sus iniciales, su nombre a mostrar (o el comienzo de su correo electrónico si no tiene uno), la mención «Admin» y, a la derecha, un ícono de salida para cerrar sesión.",
      },
      {
        n: 5,
        label: "Puentes hacia el lado cliente",
        desc: "«Ver el sitio» abre la tienda pública en una pestaña nueva, en el idioma elegido actualmente para la administración. «Mi cuenta» lleva a su perfil personal (nombre a mostrar, teléfono, contraseña) — su cuenta de administrador es también una cuenta de cliente normal.",
      },
    ],
    workflows: [
      {
        title: "Cambiar el idioma de la administración",
        steps: [
          {
            title: "Localizar el selector",
            body: "En el encabezado de cualquier página de administración, a la derecha del título, tres botones: FR, ES, EN.",
          },
          {
            title: "Hacer clic en el idioma deseado",
            body: "La página se recarga en el nuevo idioma. El idioma activo aparece sobre fondo claro y no se puede hacer clic en él.",
          },
          {
            title: "Queda memorizado",
            body: "La elección se conserva en este navegador durante un año: todas las páginas de administración se mostrarán en ese idioma, hasta su próximo cambio.",
          },
        ],
      },
      {
        title: "Comprobar el sitio como un cliente",
        steps: [
          {
            title: "Hacer clic en «Ver el sitio»",
            body: "Al pie de la barra lateral. La tienda se abre en una pestaña nueva: su pestaña de administración sigue abierta.",
          },
          {
            title: "Navegar libremente",
            body: "Está conectado con la misma cuenta: puede probar el carrito, los favoritos, una reserva, como cualquier cliente.",
          },
          {
            title: "Volver a la administración",
            body: "Cierre la pestaña de la tienda o simplemente vuelva a la pestaña anterior. Nada ha cambiado en el lado admin.",
          },
        ],
      },
      {
        title: "Leer las alertas del menú",
        steps: [
          {
            title: "Insignias de color vivo = por atender",
            body: "Stock (productos que bajan de 5 unidades), Reservas (pendientes o confirmadas, aún no entregadas) y Soporte (mensajes abiertos).",
          },
          {
            title: "Insignia gris = simple contador",
            body: "En Productos, la insignia gris indica el número de productos activos del catálogo. No es una alerta.",
          },
          {
            title: "Los contadores se refrescan al navegar",
            body: "Se actualizan con cada cambio de página, con un posible pequeño retraso. Por encima de 99, muestran «99+».",
          },
        ],
      },
    ],
    actions: [
      {
        label: "FR · ES · EN (selector de idioma)",
        where: "Encabezado de cada página de administración, a la derecha del título",
        does: "Cambia el idioma de los menús y las páginas de la administración, y nada más.",
        effects: [
          "La preferencia se guarda en este navegador durante un año.",
          "La página se recarga inmediatamente en el nuevo idioma.",
          "El sitio público no se ve afectado: cada visitante elige allí su propio idioma.",
          "Los demás administradores y las demás computadoras no se ven afectados.",
        ],
        severity: "safe",
        undo: "Haga clic en otro idioma: el cambio es inmediato.",
      },
      {
        label: "Sol / Luna (modo claro u oscuro)",
        where: "Encabezado de cada página de administración, junto al selector de idioma",
        does: "Alterna la vista de la administración entre el modo claro y el modo oscuro.",
        effects: [
          "La administración cambia de aspecto inmediatamente, sin recargar.",
          "La elección se memoriza solo en este dispositivo y este navegador.",
          "El sitio público y los demás administradores no ven ningún cambio.",
        ],
        severity: "safe",
        undo: "Haga clic en el otro ícono para volver al modo anterior.",
      },
      {
        label: "Cerrar sesión (ícono de salida)",
        where: "Al pie de la barra lateral, a la derecha de su nombre",
        does: "Cierra su sesión y le devuelve a la página de inicio de sesión.",
        effects: [
          "Su sesión se cierra en este navegador.",
          "Como su cuenta de administrador es también su cuenta de cliente, queda desconectado al mismo tiempo del sitio público en este navegador.",
          "Nadie puede seguir usando la administración en esta computadora sin volver a iniciar sesión.",
        ],
        severity: "safe",
        undo: "Vuelva a iniciar sesión con su correo electrónico y su contraseña.",
      },
    ],
    gotchas: [
      "El selector FR/ES/EN solo cambia el idioma de la ADMINISTRACIÓN. En el sitio público, el idioma forma parte de la dirección de la página y cada visitante elige el suyo.",
      "El modo claro/oscuro del encabezado es propio de su dispositivo. La PALETA de colores, en cambio, se configura en Apariencia y se aplica al sitio público Y a la administración, para todo el mundo.",
      "Cerrar sesión cierra toda la cuenta en este navegador: también queda desconectado del lado tienda (una sola cuenta sirve para ambos roles).",
      "El nombre que aparece en la tarjeta de identidad es el nombre a mostrar de su perfil; se modifica desde «Mi cuenta». Sin él, se muestra el comienzo de su correo electrónico.",
      "Las insignias del menú se refrescan cuando cambia de página, con un posible pequeño retraso: un contador puede seguir visible unos segundos después de haber atendido el elemento.",
      "La insignia de Stock cuenta los productos activos por debajo de 5 unidades, incluidos los productos totalmente agotados.",
      "No hay página de perfil en la administración: su perfil personal se gestiona en el lado tienda, mediante el enlace «Mi cuenta».",
    ],
  },
]
