import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "concepts",
    navLabel: "Conceptos clave",
    title: "Los conceptos clave — para entender antes que todo lo demás",
    route: "",
    intro:
      "Antes de abrir las pantallas una por una, tómese cinco minutos para seguir tres hilos conductores: el recorrido de un pedido (desde la reserva en el sitio hasta el cobro en el mostrador), la vida de un precio (desde el precio provisional hasta el monto realmente cobrado) y la vida de un costo (desde la factura del proveedor hasta el margen en contabilidad). Casi todo el panel de administración se entiende a partir de estas tres historias. Más abajo encontrará las reglas generales válidas en todo el panel y las confusiones más frecuentes que conviene evitar.",
    flows: [
      {
        title: "De la reserva a la venta",
        lanes: [
          [
            {
              label: "El cliente reserva en el sitio",
              note: "Desde su carrito, el cliente hace clic en « Reservar ». Obtiene una referencia (FAR-…). Importante: el stock no se mueve en ese momento.",
            },
            {
              label: "Reservada — en su bandeja de entrada",
              tone: "warn",
              note: "La solicitud aparece en la pantalla Reservas, pestaña « Reservadas ». Espera su contacto. Sin confirmación, expirará sola al cabo de 24 horas.",
            },
            {
              label: "Confirmada — cliente avisado",
              note: "Usted contacta al cliente (botón WhatsApp con mensaje prellenado: referencia y lista de productos) y luego marca la reserva como « Confirmada ».",
            },
            {
              label: "Entregada — pagada y recogida",
              tone: "ok",
              note: "El cliente pasa por la farmacia, usted cobra y marca « Entregada ». Es AHORA cuando baja el stock, se congela el costo y la venta entra en contabilidad. La línea sale de Reservas y pasa a la pantalla Ventas.",
            },
          ],
          [
            {
              label: "Venta directa en mostrador",
              note: "Para un cliente que compra en el local sin haber reservado: pantalla Ventas → « Venta mostrador ». Cliente con cuenta (existente o creada en el momento) o anónimo, a elección.",
            },
            {
              label: "Entrega inmediata",
              tone: "ok",
              note: "La venta se registra directamente como « Entregada »: el stock se descuenta al instante y la venta entra en contabilidad de inmediato. No hay paso de confirmación.",
            },
          ],
          [
            {
              label: "Sin noticias del cliente…",
              tone: "warn",
              note: "Reserva web: 24 horas. Reserva creada por usted (teléfono, mostrador): 30 días.",
            },
            {
              label: "Expirada",
              tone: "bad",
              note: "El paso a « Expirada » es automático (una verificación corre cada 15 minutos). El cliente no recibe aviso. Como el stock nunca se movió, no hay nada que devolver al estante.",
            },
          ],
        ],
      },
      {
        title: "La vida de un precio",
        lanes: [
          [
            {
              label: "Precio provisional: 100 pesos",
              tone: "warn",
              note: "Todos los productos importados al inicio traen un precio provisional de 100 pesos. Mientras no se reemplace, ESE es el precio que se muestra y el que se facturaría.",
            },
            {
              label: "Precio de venta real",
              note: "Se ingresa en la ficha del producto (pantalla Productos) o con la acción « Inicializar este producto » de la pantalla Stock.",
            },
            {
              label: "Promoción eventual",
              note: "Una campaña de promoción (pantalla Promociones) muestra en el sitio el precio tachado y el descuento. Si varias promociones apuntan al mismo producto, se aplica la más ventajosa para el cliente.",
            },
            {
              label: "Congelado en la reserva",
              note: "En el momento en que el cliente reserva, el precio del día (promoción incluida) se copia en la reserva. Una promoción creada o eliminada después no cambia nada en las reservas ya hechas.",
            },
            {
              label: "Ajustable antes del cobro",
              tone: "warn",
              note: "En el detalle de una reserva « Reservada » o « Confirmada », usted puede corregir el precio de una línea (gesto comercial, cliente fiel). El total se recalcula y la modificación queda anotada en el registro de auditoría. Por eso la ficha pública del producto lleva la mención « Precio indicativo — se confirma en farmacia ».",
            },
            {
              label: "Bloqueado en la entrega",
              tone: "ok",
              note: "En cuanto la reserva se marca como « Entregada », ya no es posible modificar ningún precio: ese es el monto que cuenta en contabilidad.",
            },
          ],
        ],
      },
      {
        title: "La vida de un costo",
        lanes: [
          [
            {
              label: "Recepción con costo",
              note: "En cada entrega del proveedor, usted registra una « Entrada de stock » en la pantalla Stock: cantidades recibidas Y costo unitario pagado (con, de forma opcional, los datos de la factura del proveedor para las declaraciones fiscales).",
            },
            {
              label: "Costo promedio ponderado",
              note: "El producto conserva un costo promedio, recalculado automáticamente en cada recepción (mezcla del stock antiguo y del nuevo, en proporción a las cantidades).",
            },
            {
              label: "Congelado en la venta",
              note: "En el momento de la entrega, el costo promedio del día se copia de una vez por todas en la venta. Las recepciones siguientes ya no cambian el margen de esa venta.",
            },
            {
              label: "Margen en contabilidad",
              tone: "ok",
              note: "La pantalla Contabilidad calcula: ventas cobradas − costo de los productos vendidos − gastos = resultado. Las ventas cuyo costo se desconoce se señalan aparte, nunca se cuentan como « costo cero ».",
            },
          ],
          [
            {
              label: "Merma / producto vencido",
              tone: "warn",
              note: "Producto vencido, dañado, robado o diferencia de inventario: use la acción de merma en la pantalla Stock (razón a elegir: vencido, dañado, robo, ajuste).",
            },
            {
              label: "Stock reducido + gasto al costo",
              tone: "bad",
              note: "El stock baja y un gasto « merma » entra en contabilidad, valorado al costo promedio del producto (nunca al precio de venta). Si el costo se desconoce, el stock baja igual pero no se crea ningún gasto.",
            },
          ],
        ],
      },
    ],
    actions: [
      {
        label: "Una cuenta = dos roles",
        where: "Todo el panel",
        does:
          "Ser admin no es una cuenta aparte: es su cuenta de cliente habitual, a la que se le añadió el rol de admin. Usted conserva su carrito, sus reservas, sus favoritos y su perfil personales.",
        effects: [
          "Al pie del menú admin: « Ver el sitio » abre la tienda, « Mi cuenta » abre su espacio personal de cliente.",
          "Desde su espacio de cliente, un enlace « Panel de administración » lo trae de vuelta aquí.",
          "Para dar acceso al panel a un colega, se promueve su cuenta de cliente existente (pantalla Usuarios) — no se crea ninguna cuenta especial.",
          "Quitarle el rol de admin a alguien no elimina su cuenta de cliente: simplemente vuelve a ser un cliente normal.",
        ],
        severity: "safe",
      },
      {
        label: "El idioma del panel es independiente del sitio público",
        where: "Encabezado de cada página admin (botones FR / ES / EN)",
        does:
          "Puede trabajar en el panel en francés, español o inglés. Esta elección solo afecta a SU pantalla de administración.",
        effects: [
          "El sitio público conserva sus tres idiomas, elegidos por cada visitante — su ajuste de admin no cambia nada allí.",
          "Cada uno de sus colegas admins tiene su propio idioma de trabajo.",
          "La elección se memoriza en su navegador durante aproximadamente un año.",
        ],
        severity: "safe",
      },
      {
        label: "El stock NUNCA baja con la reserva",
        where: "Reservas, Ventas, Stock",
        does:
          "Reservar no aparta nada en la base de datos. El stock solo se descuenta en el momento en que usted marca la reserva como « Entregada » (o en una venta mostrador, entregada de inmediato).",
        effects: [
          "Dos clientes pueden reservar la misma última unidad: verifique el estante antes de confirmar.",
          "Una reserva expirada o cancelada antes de la entrega no tiene ningún efecto en el stock — nada que devolver al estante.",
          "Si anula una venta ya « Entregada », el stock se vuelve a acreditar automáticamente.",
          "El stock mostrado en el sitio nunca baja de cero, aunque el conteo del sistema estuviera equivocado.",
        ],
        severity: "caution",
        accountingImpact: "La venta solo entra en contabilidad (ingresos, costo, margen) en el momento de la entrega.",
      },
      {
        label: "Las acciones importantes quedan anotadas en el registro de auditoría",
        where: "Acceso › Registro",
        does:
          "Casi cada creación, modificación o eliminación hecha en el panel (productos, precios, stock, reservas, promociones, configuración…) se anota automáticamente: quién, qué, cuándo y qué campos se modificaron (con sus nuevos valores).",
        effects: [
          "Todos los admins pueden consultar el registro — útil para entender « quién cambió este precio ».",
          "Las modificaciones sensibles (el precio de una reserva, por ejemplo) se marcan como « alto impacto ».",
          "Las simples consultas de pantallas no se anotan: solo lo que modifica datos.",
        ],
        severity: "safe",
      },
      {
        label: "Las reservas expiran solas",
        where: "Reservas",
        does:
          "Una reserva web no confirmada pasa automáticamente a « Expirada » después de 24 horas (30 días para una reserva creada por usted). Una verificación corre cada 15 minutos, sin intervención de su parte.",
        effects: [
          "El cliente no recibe aviso de la expiración: si quiere darle seguimiento, hágalo antes de que venza el plazo.",
          "Una reserva « Confirmada » ya no expira: confirmar protege la solicitud.",
          "Como el stock nunca se movió, una expiración no requiere ningún reacomodo.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Recepción ≠ ajuste. La « Entrada de stock » (entrega del proveedor, con costo) alimenta el costo promedio y el registro de compras. « Ajustar inventario » solo corrige el número de unidades, sin tocar el costo: si registra una entrega como un ajuste, el costo promedio queda mal y el margen también.",
      "El precio mostrado en el sitio puede diferir del precio cobrado: usted puede ajustar el precio de una línea de reserva antes de la entrega. Es algo asumido — la ficha pública del producto anuncia « Precio indicativo — se confirma en farmacia ».",
      "Eliminar ≠ desactivar. Desactivar un producto lo retira del sitio pero lo conserva todo (fotos, historial, stock): es reversible. Eliminar es definitivo: las fotos y el historial de recepciones y de mermas desaparecen con él. Solo sobreviven las ventas pasadas (guardan una copia del nombre y del precio). En caso de duda, desactive.",
      "Una promoción creada después no cambia las reservas ya hechas: su precio quedó congelado en el momento de la reserva.",
      "El catálogo llegó con un precio provisional de 100 pesos en todos los productos. Mientras no se ingrese el precio real, ese es el monto que se muestra y el que se facturaría — de ahí la acción « Inicializar este producto » de la pantalla Stock.",
      "Cancelar una reserva nunca entregada no tiene consecuencias (ni stock, ni contabilidad). Anular una venta ya entregada vuelve a acreditar el stock y retira la venta del diario de ventas: resérvelo para los verdaderos errores de caja.",
    ],
  },
]
