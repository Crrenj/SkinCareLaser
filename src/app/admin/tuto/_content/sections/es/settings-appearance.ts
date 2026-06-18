import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "settings",
    navLabel: "Configuración de la tienda",
    title: "Tienda y reservas — datos de contacto y punto de retiro",
    route: "/admin/settings",
    intro:
      "Esta pantalla reúne la información oficial de la tienda: el nombre y el lema (se guardan, pero por ahora no tienen efecto visible en el sitio), los datos de contacto (email, teléfono, número de WhatsApp) y el punto de retiro de las reservas (nombre, dirección, horarios, teléfono). Estos valores alimentan el pie de página, la página Contacto, la página Farmacia, la página « Acerca de », la página de confirmación, el email de confirmación enviado al cliente y los enlaces de WhatsApp prellenados. Importante: la tienda funciona únicamente con retiro en farmacia, gratuito — no existe ninguna entrega pagada, así que aquí no hay ninguna tarifa de envío que configurar. También se configura aquí un descuento de empleado (en %): aplicado a mano durante una venta en mostrador y mostrado a todo el equipo en la banda de la administración.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Admin / Configuración / Tienda y reservas" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Identidad de la tienda: nombre (obligatorio) · lema", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Contacto y WhatsApp: email · teléfono · número WhatsApp", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Reserva y retiro: recordatorio del funcionamiento (3 pasos · conservación 24 h)", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "Punto de retiro: nombre · dirección completa · horarios · teléfono farmacia", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "Personal: descuento de empleado (%) aplicado en el mostrador", hotspot: 7 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Cambios sin guardar", hotspot: 5 },
            { w: 3, kind: "button", label: "Cancelar" },
            { w: 3, kind: "button", label: "Guardar", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Tarjeta « Identidad de la tienda »",
        desc: "El nombre de la tienda (obligatorio, no puede quedar vacío) y el lema. Atención: estos dos campos se guardan, pero el sitio público muestra hoy un nombre y un logo fijos — modificarlos no tiene por ahora ningún efecto visible para los clientes.",
      },
      {
        n: 2,
        label: "Tarjeta « Contacto y WhatsApp »",
        desc: "El email y el teléfono que se muestran en las páginas Contacto y Farmacia y que sirven de respaldo en la página de confirmación. El número de WhatsApp se usa para generar los botones « Confirmar mi reserva por WhatsApp » que se entregan a los clientes: escríbalo en formato internacional (por ejemplo +18094122468).",
      },
      {
        n: 3,
        label: "Recuadro « Reserva y retiro »",
        desc: "Un simple recordatorio del funcionamiento: el cliente reserva en línea, usted lo contacta por WhatsApp, y él retira y paga en la farmacia. Ahí se recuerda también la conservación de 24 h de las reservas. Nada en este recuadro se puede modificar: es información, no un ajuste.",
      },
      {
        n: 4,
        label: "Campos « Punto de retiro »",
        desc: "El nombre, la dirección completa, los horarios y el teléfono de la farmacia donde el cliente retira su reserva. Esta información se muestra en la página « Acerca de », en el mensaje de WhatsApp prellenado de la página de confirmación y en el email de confirmación enviado al cliente. Atención: la dirección y los horarios que se muestran en el túnel de reserva y en la página Farmacia todavía son fijos — estos campos no los cambian.",
      },
      {
        n: 5,
        label: "Barra de guardado",
        desc: "Esta barra oscura solo aparece cuando al menos un campo fue modificado. Mientras esté visible, nada está guardado todavía: si sale de la página sin pulsar « Guardar », sus cambios se pierden.",
      },
      {
        n: 6,
        label: "Botón « Guardar »",
        desc: "Guarda de una vez todos los campos de la pantalla. El nombre de la tienda debe estar lleno y el email de contacto debe ser una dirección válida; de lo contrario aparece un mensaje de error y no se guarda nada.",
      },
      {
        n: 7,
        label: "Campo « Descuento de empleado »",
        desc: "Sección « Personal »: un porcentaje (de 0 a 100) reservado al personal. En cuanto pasa de 0, aparece una banda « Promo empleados · −X % » en la parte superior de todas las páginas de la administración, y una casilla « tarifa de empleado » queda disponible en la venta de mostrador. A 0, ningún descuento y la banda desaparece. Este descuento nunca toca los precios del catálogo público.",
      },
    ],
    workflows: [
      {
        title: "Actualizar los datos de contacto",
        steps: [
          {
            title: "Modificar los campos",
            body: "En la tarjeta « Contacto y WhatsApp », corrija el email, el teléfono o el número de WhatsApp. La barra oscura « Cambios sin guardar » aparece abajo.",
          },
          {
            title: "Guardar",
            body: "Pulse « Guardar » en la barra inferior. Un mensaje « Configuración guardada » confirma la operación.",
          },
          {
            title: "Verificar en el sitio",
            body: "Abra la página Contacto y la página Farmacia del sitio público: los nuevos datos aparecen en unos minutos como máximo. El pie de página y los botones de WhatsApp también se actualizan.",
          },
        ],
      },
      {
        title: "Cambiar la información del punto de retiro",
        steps: [
          {
            title: "Modificar el punto de retiro",
            body: "En la tarjeta « Reserva y retiro », debajo del recordatorio del funcionamiento, corrija el nombre, la dirección, los horarios o el teléfono de la farmacia.",
          },
          {
            title: "Guardar",
            body: "Pulse « Guardar » en la barra inferior.",
          },
          {
            title: "Verificar el recorrido del cliente",
            body: "La nueva información aparece en la página « Acerca de », en el mensaje de WhatsApp de la página de confirmación y en los próximos emails de confirmación. En cambio, la dirección que se muestra en el túnel de reserva y en la página Farmacia no sigue estos campos: todavía es fija. Las reservas ya realizadas no se modifican.",
          },
        ],
      },
      {
        title: "Configurar un descuento para el personal",
        steps: [
          {
            title: "Ingresar la tasa",
            body: "En la sección « Personal », escriba el porcentaje de descuento de empleado (por ejemplo 15). Ponga 0 para desactivarlo.",
          },
          {
            title: "Guardar",
            body: "Pulse « Guardar » en la barra inferior.",
          },
          {
            title: "Verificar",
            body: "Aparece una banda « Promo empleados · −X % » en la parte superior de la administración (visible para todo el equipo), y en la pantalla Ventas ahora se ofrece una casilla « tarifa de empleado » durante una venta en mostrador.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Guardar",
        where: "Barra oscura en la parte inferior de la pantalla (solo aparece si un campo fue modificado)",
        does: "Guarda de una vez los once campos de la pantalla: nombre, lema, email, teléfono, número de WhatsApp, los cuatro datos del punto de retiro, el umbral de stock bajo y el descuento de empleado.",
        effects: [
          "Todos los valores se guardan juntos en la base de datos (solo existe una ficha de tienda).",
          "El sitio público adopta los nuevos valores en unos minutos como máximo: pie de página, página Contacto, página Farmacia, página « Acerca de », página de confirmación.",
          "Los próximos emails de confirmación de reserva y los botones de WhatsApp entregados a los clientes usan los nuevos datos.",
          "El guardado se rechaza con un mensaje si el nombre de la tienda está vacío, si el email de contacto no es una dirección válida o si un campo supera los 400 caracteres.",
          "Un campo borrado (dejado vacío) desaparece del sitio público: la línea correspondiente deja de mostrarse.",
        ],
        severity: "caution",
        undo: "Vuelva a escribir los valores anteriores y guarde de nuevo. No se conservan en ningún otro lugar: anótelos antes de un cambio grande.",
        audited: true,
        publicImpact: "Los datos de contacto y el punto de retiro cambian para todos los visitantes del sitio, en unos minutos como máximo.",
      },
      {
        label: "Descuento de empleado (%)",
        where: "Sección « Personal » — campo numérico (de 0 a 100), guardado con el botón « Guardar »",
        does: "Define la tasa de descuento reservada al personal, aplicada manualmente durante una venta en mostrador.",
        effects: [
          "La tasa (de 0 a 100) se guarda en la ficha de la tienda junto con los demás ajustes.",
          "En cuanto pasa de 0, una banda « Promo empleados · −X % » se muestra en la parte superior de TODAS las páginas de la administración, visible para todo el equipo, con un enlace hacia este ajuste.",
          "En la pantalla Ventas, una casilla « tarifa de empleado » queda disponible: marcada durante una venta en mostrador, aplica esta tasa (precio recalculado del lado del servidor).",
          "A 0, ningún descuento es posible y la banda desaparece.",
          "Esta tasa NUNCA se aplica automáticamente a los precios del catálogo público: es una herramienta interna de mostrador.",
        ],
        severity: "caution",
        audited: true,
        accountingImpact: "Una venta en mostrador con tarifa de empleado entra en los ingresos por su monto con descuento — el margen se reduce en consecuencia.",
      },
      {
        label: "Cancelar",
        where: "Barra oscura en la parte inferior de la pantalla, a la izquierda de « Guardar »",
        does: "Abandona las modificaciones en curso y devuelve todos los campos a su último valor guardado.",
        effects: [
          "Los campos vuelven a los valores guardados; no se envía nada a la base de datos.",
          "Solo funciona antes de haber pulsado « Guardar »: después del guardado, este botón no recupera los valores anteriores.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "El « Nombre de la tienda » y el « Lema » se guardan, pero el sitio público muestra hoy un nombre y un logo fijos: modificar estos dos campos no tiene por ahora ningún efecto visible para los clientes.",
      "No hay entregas: la tienda funciona únicamente con retiro en farmacia, gratuito. Por eso esta pantalla no contiene ninguna tarifa de envío. En la base de datos todavía existen antiguos montos de envío, pero no se usan en ninguna parte — ignórelos.",
      "El recuadro « Reserva y retiro » (los tres pasos y la conservación de 24 h) es un simple recordatorio: nada ahí es configurable. El plazo de 24 h antes de la expiración automática de una reserva es fijo y no se cambia aquí.",
      "Los campos « Punto de retiro » no cambian todo el sitio: la dirección y los horarios que se muestran en el paso de retiro del túnel de reserva y en la página Farmacia todavía están escritos de forma fija. En cambio, estos campos alimentan la página « Acerca de », el mensaje de WhatsApp y el email de confirmación enviados al cliente.",
      "Escriba el número de WhatsApp en formato internacional con el código del país (por ejemplo +18094122468). Si está vacío, los botones « Confirmar por WhatsApp » envían al cliente a la página Contacto, y la página de confirmación ofrece el teléfono o el email como respaldo.",
      "Un campo de contacto dejado vacío simplemente desaparece del sitio: sin email de contacto, la línea de email ya no aparece en las páginas Contacto y Farmacia.",
      "Nada queda guardado mientras la barra oscura « Cambios sin guardar » esté visible: si cambia de página antes de pulsar « Guardar », todo se pierde.",
      "Los valores anteriores no se conservan: el registro de actividad anota qué se cambió y quién lo hizo, pero no los valores previos. Anótelos antes de un cambio importante.",
      "Cuente con unos minutos antes de ver los cambios en el sitio público: las páginas se actualizan automáticamente, pero no al instante.",
      "El descuento de empleado es una herramienta INTERNA: nunca baja los precios del catálogo público y solo se aplica en el mostrador, marcando una casilla, a mano.",
      "La banda « Promo empleados · −X % » es visible para todos los administradores (vive en la banda de la administración); desaparece en cuanto la tasa vuelve a 0.",
    ],
  },
  {
    id: "appearance",
    navLabel: "Apariencia",
    title: "Tema de la página — paleta de colores, modo claro/oscuro, opción del visitante",
    route: "/admin/apariencia",
    intro:
      "Esta pantalla elige el aspecto visual del sitio: una paleta de colores entre seis (Terra, Noir, Botánico, Coral, Marino, Ámbar), el modo por defecto del sitio público (claro, oscuro o « Sistema », que sigue el ajuste del dispositivo del visitante) y la autorización para que los visitantes cambien por sí mismos entre claro y oscuro mediante un botón en el pie de página. La paleta elegida se aplica al sitio público Y al panel de administración; el ícono de la pestaña del navegador (el colibrí) también sigue el tema. Todo el contenido (productos, textos, fotos) permanece idéntico: solo cambian los colores.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Admin / Personalización / Tema de la página" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "Terra ✓ (vista previa + 3 muestras)", hotspot: 1 },
            { w: 4, kind: "panel", label: "Noir" },
            { w: 4, kind: "panel", label: "Botánico" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "Coral" },
            { w: 4, kind: "panel", label: "Marino" },
            { w: 4, kind: "panel", label: "Ámbar" },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "tabs", label: "Modo por defecto: Claro · Oscuro · Sistema", hotspot: 2 },
            { w: 6, kind: "tabs", label: "Visitante puede cambiar: Sí · No", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Último cambio · fecha · el sitio público se actualiza en la próxima carga" },
            { w: 3, kind: "button", label: "Cancelar", hotspot: 4 },
            { w: 3, kind: "button", label: "Guardar tema", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Cuadrícula de las seis paletas",
        desc: "Cada tarjeta muestra una vista previa (el fondo del tema con el colibrí), una banda de tres muestras de color, el nombre de la paleta y sus tonos. Pulse una tarjeta para seleccionarla: una marca de verificación y un borde de color señalan su elección. Nada cambia mientras no haya guardado.",
      },
      {
        n: 2,
        label: "« Modo por defecto »",
        desc: "El modo en el que el sitio público se muestra a los visitantes: Claro, Oscuro o Sistema (el sitio sigue entonces el ajuste claro/oscuro del dispositivo de cada visitante). Este ajuste no afecta al panel de administración, que tiene su propio interruptor en la parte superior de cada página.",
      },
      {
        n: 3,
        label: "« Visitante puede cambiar »",
        desc: "En « Sí », un botón sol/luna aparece en el pie de página del sitio público: cada visitante puede alternar entre claro y oscuro, y su elección se recuerda en su dispositivo. En « No », el botón desaparece y las elecciones ya hechas por los visitantes se ignoran: todos ven el modo por defecto.",
      },
      {
        n: 4,
        label: "Botón « Cancelar »",
        desc: "Devuelve la selección (paleta, modo, opción del visitante) a como estaba en el último guardado. Aparece gris si no hay nada que cancelar. Sin efecto una vez hecho el guardado.",
      },
      {
        n: 5,
        label: "Botón « Guardar tema »",
        desc: "Aplica sus elecciones. El panel de administración y el ícono de la pestaña cambian de inmediato, sin recargar la página; el sitio público adopta la nueva paleta en la próxima carga de página de cada visitante.",
      },
    ],
    workflows: [
      {
        title: "Cambiar la paleta de colores del sitio",
        steps: [
          {
            title: "Elegir una tarjeta",
            body: "Pulse la paleta deseada en la cuadrícula: la marca de verificación y el borde confirman la selección. Las muestras de cada tarjeta dan una idea de los tonos (fondo claro, fondo oscuro, color de acento).",
          },
          {
            title: "Guardar",
            body: "Pulse « Guardar tema ». Un mensaje « Tema guardado » lo confirma. El panel de administración toma los nuevos colores de inmediato — es normal, no hace falta recargar.",
          },
          {
            title: "Verificar el sitio público",
            body: "Abra o recargue una página del sitio público: la nueva paleta se muestra. El ícono de la pestaña del navegador (el colibrí) también cambió de colores.",
          },
          {
            title: "Volver atrás si hace falta",
            body: "¿No le convence? Vuelva a seleccionar la paleta anterior y guarde de nuevo: todo vuelve exactamente a como estaba, no se pierde nada.",
          },
        ],
      },
      {
        title: "Poner el sitio público en modo oscuro por defecto",
        steps: [
          {
            title: "Elegir « Oscuro »",
            body: "En « Modo por defecto », pulse « Oscuro ». Elija « Sistema » si prefiere que el sitio siga el ajuste del dispositivo de cada visitante.",
          },
          {
            title: "Decidir sobre el cambio del visitante",
            body: "Con « Visitante puede cambiar: Sí », un visitante que prefiera el claro podrá volver al claro con el botón del pie de página. En « No », todos quedan en oscuro.",
          },
          {
            title: "Guardar y controlar",
            body: "Pulse « Guardar tema » y luego recorra algunas páginas del sitio público en oscuro: el modo oscuro es reciente, verifique que todo le parezca legible.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Guardar tema",
        where: "En la parte inferior de la pantalla, a la derecha (gris mientras no se haya modificado nada)",
        does: "Guarda juntos la paleta elegida, el modo por defecto y la autorización de cambio del visitante, y luego lo aplica todo.",
        effects: [
          "Los tres ajustes se guardan en la base de datos (la misma ficha de tienda que la configuración).",
          "El panel de administración toma los nuevos colores de inmediato, sin recargar la página.",
          "El ícono de la pestaña del navegador (el colibrí) pasa a los colores del nuevo tema, al instante.",
          "El sitio público muestra la nueva paleta en la próxima carga de página de cada visitante.",
          "Si la opción del visitante pasa a « No », el botón sol/luna desaparece del pie de página y las preferencias claro/oscuro ya guardadas por los visitantes se ignoran.",
        ],
        severity: "caution",
        undo: "Vuelva a seleccionar la paleta y los ajustes anteriores y guarde de nuevo: el regreso es exacto, nunca se pierde nada.",
        audited: true,
        publicImpact: "Todos los colores del sitio cambian para todos los visitantes (el contenido, los precios y las fotos permanecen idénticos).",
      },
      {
        label: "Cancelar",
        where: "En la parte inferior de la pantalla, a la izquierda de « Guardar tema »",
        does: "Abandona la selección en curso y vuelve a los ajustes del último guardado.",
        effects: [
          "La tarjeta seleccionada, el modo por defecto y la opción del visitante vuelven a su estado guardado; no se envía nada a la base de datos.",
          "Sin efecto una vez pulsado « Guardar tema »: en ese caso hay que volver a seleccionar el tema anterior y guardar de nuevo.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Pulsar una tarjeta de tema no cambia nada por sí solo: la selección solo se aplica al pulsar « Guardar tema ». Las tarjetas muestran muestras de color, no una vista previa en vivo de las páginas.",
      "La paleta se aplica al sitio público Y al panel de administración. En cambio, el « Modo por defecto » (claro/oscuro) solo afecta al sitio público: el panel de administración tiene su propio interruptor claro/oscuro en la parte superior de cada página, personal para cada miembro del equipo.",
      "« Visitante puede cambiar: No » hace dos cosas: el botón sol/luna desaparece del pie de página, y las preferencias claro/oscuro ya elegidas por los visitantes se ignoran — todos vuelven a ver el modo por defecto.",
      "Después de guardar, el panel de administración y el ícono de la pestaña cambian de inmediato; el sitio público, en cambio, adopta la nueva paleta en la próxima carga de página (el texto al pie de la pantalla lo recuerda).",
      "El modo oscuro es reciente: algunas bandas decorativas del sitio pueden verse invertidas en oscuro (legibles, pero distintas). Recorra el sitio público después de activarlo para verificar que el resultado le convenza.",
      "Cambiar de tema no toca ni los productos, ni los precios, ni los textos, ni las fotos: únicamente los colores. Es totalmente reversible — Terra es la paleta original de la tienda.",
    ],
  },
]
