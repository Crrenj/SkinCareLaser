import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "promotions",
    navLabel: "Promociones",
    title: "Promociones — descuentos con fecha, visibles en toda la tienda",
    route: "/admin/promotions",
    intro:
      "Esta pantalla gestiona las campañas de descuento: un porcentaje (ej. −20 %) o un monto fijo en pesos (ej. −100 DOP), aplicado a productos concretos, a toda una marca, a una gama o a una etiqueta, durante el período que usted elija. En cuanto una promoción está en línea, el cliente ve en todas partes el precio rebajado con el precio anterior tachado y el porcentaje de descuento: catálogo, ficha de producto, página de inicio, favoritos, carrito, búsqueda. El precio rebajado es también el que queda registrado en la reserva del cliente — y por lo tanto el que la contabilidad contará como venta.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catálogo / Promociones" },
            { w: 4, kind: "button", label: "+ Nueva promoción", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "text", label: "Campañas de descuento (% o monto fijo) aplicadas a los productos seleccionados…" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Nombre · Descuento · Período · Objetivos · Estado · lápiz · papelera", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "panel", label: "Insignia: En línea / Programada / Expirada / Fuera de línea", hotspot: 3 },
            { w: 6, kind: "panel", label: "Lápiz = editar · Papelera = eliminar", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Panel: nombre · % o DOP · valor · inicio/fin · casilla Activa · objetivos", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Botón « Nueva promoción »",
        desc: "Abre el panel de creación a la derecha. No se guarda nada hasta que pulse « Crear promoción » al final del panel.",
      },
      {
        n: 2,
        label: "Lista de campañas",
        desc: "Una fila por promoción: su nombre, el descuento (con % o DOP), el período « inicio → fin », hasta tres objetivos (más allá, un contador « +N ») y su estado. Las más recientes están arriba.",
      },
      {
        n: 3,
        label: "Insignia de estado",
        desc: "Se calcula automáticamente, no hay nada que pulsar: « Programada » antes de la fecha de inicio, « En línea » durante el período, « Expirada » después de la fecha de fin, « Fuera de línea » si la casilla « Activa » está desmarcada. Solo las promociones « En línea » cambian los precios.",
      },
      {
        n: 4,
        label: "Botones al final de la fila",
        desc: "El lápiz abre el panel de edición (los mismos campos que al crear). La papelera elimina la campaña tras una ventana de confirmación.",
      },
      {
        n: 5,
        label: "Panel de creación / edición",
        desc: "De arriba abajo: nombre de la campaña; elección entre Porcentaje o Monto fijo; el valor; las fechas y horas de inicio y de fin; la casilla « Activa (visible en la tienda) »; el bloque Objetivos. El botón de abajo permanece gris mientras falte el nombre, el valor, una de las dos fechas o al menos un objetivo.",
      },
    ],
    workflows: [
      {
        title: "Lanzar una promoción con fecha",
        steps: [
          {
            title: "Abrir el panel",
            body: "Pulse « Nueva promoción » y dé un nombre claro a la campaña (ej. « Rebajas de enero »). Este nombre solo es visible en el admin.",
          },
          {
            title: "Elegir el descuento",
            body: "Porcentaje (máximo 100) o monto fijo en DOP, y luego el valor. Un monto fijo mayor que el precio de un producto da un precio de 0, nunca un precio negativo.",
          },
          {
            title: "Fijar el período",
            body: "Indique inicio y fin (fecha y hora). El fin debe ser posterior al inicio. La promoción arranca y se detiene sola en esas fechas.",
          },
          {
            title: "Añadir los objetivos",
            body: "Elija el tipo: Producto (búsqueda por nombre), Marca, Gama o Etiqueta (lista desplegable y luego « Añadir »). Apuntar a una marca o a una gama cubre todos sus productos, incluidos los que se añadan al catálogo más adelante.",
          },
          {
            title: "Guardar",
            body: "Deje la casilla « Activa » marcada y pulse « Crear promoción ». Si el período está en curso, los precios rebajados aparecen en la tienda en menos de un minuto.",
          },
          {
            title: "Verificar en el sitio",
            body: "Abra la ficha de un producto afectado en el sitio público: el precio rebajado se muestra con el precio anterior tachado y la insignia de descuento.",
          },
        ],
      },
      {
        title: "Detener una promoción antes de la fecha de fin",
        steps: [
          {
            title: "Abrir la promoción",
            body: "En la lista, pulse el lápiz de la campaña que quiere cortar.",
          },
          {
            title: "Desmarcar « Activa »",
            body: "Desmarque la casilla « Activa (visible en la tienda) ». La campaña queda guardada con todas sus fechas y objetivos.",
          },
          {
            title: "Guardar",
            body: "Pulse « Guardar ». Los productos vuelven al precio normal en la tienda en menos de un minuto. La insignia pasa a « Fuera de línea ».",
          },
          {
            title: "Saber qué no cambia",
            body: "Las reservas ya creadas durante la promoción conservan su precio rebajado: nada se mueve para esos clientes ni para la contabilidad.",
          },
        ],
      },
      {
        title: "Modificar el descuento de una promoción en curso",
        steps: [
          {
            title: "Abrir con el lápiz",
            body: "El panel se abre prellenado con la configuración actual, objetivos incluidos.",
          },
          {
            title: "Cambiar el valor",
            body: "Ajuste el porcentaje o el monto, o el período, o los objetivos. Al guardar, la lista de objetivos se sustituye por la que se muestra en el panel.",
          },
          {
            title: "Guardar y verificar",
            body: "El nuevo precio se refleja en la tienda en menos de un minuto. Solo las reservas futuras usarán este nuevo precio: las ya realizadas conservan el anterior.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Crear una promoción",
        where: "Botón « Nueva promoción » arriba de la página, y luego « Crear promoción » al final del panel",
        does: "Guarda una nueva campaña de descuento con su nombre, su tipo (% o monto fijo), su valor, su período, su estado activa/inactiva y su lista de objetivos.",
        effects: [
          "La campaña queda guardada en la base de datos y aparece arriba de la lista.",
          "Si la casilla « Activa » está marcada y el período está en curso, el precio rebajado se aplica en toda la tienda en menos de un minuto: precio tachado + insignia de descuento.",
          "Toda reserva creada durante la promoción registra el precio rebajado — ese es el precio que el cliente paga en la farmacia y el que cuenta la contabilidad, aunque la promoción se detenga o cambie después. Solo un ajuste manual del precio, línea por línea, desde la reserva puede aún modificarlo.",
          "Si un producto está cubierto por varias promociones, se aplica el precio más bajo para el cliente (los descuentos no se suman).",
          "Si un objetivo elegido ya no existe (producto eliminado entretanto), no se guarda nada y se muestra el mensaje « Un objetivo seleccionado ya no existe ».",
        ],
        severity: "caution",
        undo: "Abra la promoción y desmarque « Activa » (o elimínela): los precios vuelven al precio normal en menos de un minuto. Las reservas ya creadas, sin embargo, conservan su precio rebajado.",
        audited: true,
        publicImpact: "El precio rebajado (con el precio anterior tachado y la insignia −X %) se muestra en todas partes: catálogo, ficha de producto, página de inicio, favoritos, carrito y búsqueda.",
        accountingImpact: "Las reservas realizadas durante la promoción se registran al precio rebajado: la facturación contabilizada es el monto realmente cobrado.",
      },
      {
        label: "Editar una promoción",
        where: "Lápiz al final de la fila, y luego « Guardar » al final del panel",
        does: "Sustituye toda la configuración de la campaña por el contenido del panel: nombre, tipo y valor del descuento, fechas, casilla « Activa » y la lista completa de objetivos.",
        effects: [
          "La nueva configuración se aplica de inmediato; los precios en la tienda la siguen en menos de un minuto.",
          "La lista de objetivos se sustituye por completo: un objetivo retirado del panel deja de beneficiarse del descuento desde el momento de guardar.",
          "Las reservas ya creadas no se mueven: su precio quedó congelado en el momento en que el cliente reservó.",
          "Si uno de los objetivos mostrados corresponde a un elemento eliminado del catálogo, el guardado se rechaza: retire primero el objetivo marcado « (eliminado) ».",
        ],
        severity: "caution",
        undo: "Vuelva a abrir la promoción y restablezca los valores anteriores (también pueden consultarse en el registro de auditoría).",
        audited: true,
        publicImpact: "Los nuevos precios rebajados sustituyen a los anteriores en todo el sitio en menos de un minuto.",
        accountingImpact: "Solo las reservas futuras usan el nuevo precio; las ventas ya registradas conservan el suyo.",
      },
      {
        label: "Poner fuera de línea / volver a poner en línea (casilla « Activa »)",
        where: "Casilla « Activa (visible en la tienda) » en el panel de edición, y luego « Guardar »",
        does: "Corta o reactiva el descuento de inmediato, sin tocar las fechas ni los objetivos. Es el interruptor principal de la campaña.",
        effects: [
          "Desmarcada: el descuento cesa aunque el período no haya terminado; los productos vuelven al precio normal en la tienda en menos de un minuto; la insignia pasa a « Fuera de línea ».",
          "Marcada de nuevo: el descuento se reactiva al instante, siempre que el período siga en curso (si no, la insignia indica « Programada » o « Expirada » y nada cambia para el cliente).",
          "Las reservas ya creadas conservan su precio rebajado en ambos casos.",
        ],
        severity: "caution",
        undo: "Marque (o desmarque) la casilla y guarde de nuevo: el efecto es inmediato y la campaña nunca se pierde.",
        audited: true,
        publicImpact: "Activa/desactiva la visualización del precio rebajado en todo el sitio público.",
      },
      {
        label: "Eliminar una promoción",
        where: "Papelera al final de la fila, y luego confirmación en la ventana « Eliminar »",
        does: "Borra definitivamente la campaña y su lista de objetivos de la base de datos, tras confirmación.",
        effects: [
          "La campaña desaparece de la lista y no puede restaurarse: para relanzarla, habrá que crearla de nuevo por completo.",
          "Los precios rebajados vuelven al precio normal en la tienda en menos de un minuto.",
          "Las reservas y ventas ya registradas conservan su precio rebajado: el historial de los clientes y la contabilidad no cambian.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "Los productos afectados vuelven al precio normal en todo el sitio público.",
        accountingImpact: "Ningún efecto sobre las ventas pasadas: su precio quedó congelado en el momento de cada reserva.",
      },
    ],
    flows: [
      {
        title: "Ciclo de vida de una promoción",
        lanes: [
          [
            {
              label: "Programada",
              tone: "neutral",
              note: "La fecha de inicio aún no ha llegado: la campaña está guardada pero no tiene ningún efecto en la tienda.",
            },
            {
              label: "En línea",
              tone: "ok",
              note: "Período en curso y casilla « Activa » marcada: precio rebajado + precio tachado en la tienda, reservas registradas al precio rebajado.",
            },
            {
              label: "Expirada",
              tone: "neutral",
              note: "En la fecha y hora de fin, el descuento se detiene solo. La campaña queda en la lista como referencia.",
            },
          ],
          [
            {
              label: "Fuera de línea",
              tone: "warn",
              note: "Casilla « Activa » desmarcada: el descuento se corta de inmediato, sea cual sea el período. Marque la casilla de nuevo para reactivarlo.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "No hay interruptor en la lista: para cortar o reactivar una promoción, ábrala con el lápiz y marque/desmarque « Activa », y luego guarde.",
      "Varias promociones sobre el mismo producto nunca se suman: se aplica el precio más bajo para el cliente.",
      "El precio pagado es el del momento en que el cliente reserva: conserva su precio rebajado aunque usted detenga la promoción después. A la inversa, un carrito llenado durante la promoción pero reservado después del fin paga el precio normal.",
      "La fecha de fin queda excluida: a la hora de fin en punto, el descuento ya no se aplica. El fin debe ser posterior al inicio, y un porcentaje no puede superar 100.",
      "Un monto fijo mayor que el precio de un producto da un precio de 0 DOP, nunca un precio negativo — verifique el valor cuando apunte a toda una marca cuyos precios varían.",
      "Apuntar a una marca, una gama o una etiqueta cubre automáticamente todos los productos vinculados, incluidos los que se añadan al catálogo después de crear la promoción.",
      "Si un elemento apuntado fue eliminado del catálogo, se muestra « (eliminado) » en la lista, y deberá retirar ese objetivo antes de poder guardar cualquier modificación de la campaña.",
      "Los cambios de precio aparecen en la tienda en menos de un minuto: si no ve nada, espere unos instantes y recargue la página pública.",
    ],
  },
]
