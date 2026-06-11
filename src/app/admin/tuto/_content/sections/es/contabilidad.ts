import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "contabilidad",
    navLabel: "Contabilidad",
    title: "Contabilidad — el balance del mes",
    route: "/admin/contabilidad",
    intro:
      "Esta pantalla resume las finanzas de un mes: lo que la farmacia cobró, lo que costaron los productos vendidos, los gastos (alquiler, salarios…) y el resultado neto. Casi todo es de solo lectura: las cifras se calculan automáticamente a partir de las ventas cobradas, las recepciones de stock y las pérdidas declaradas. Lo único que usted registra aquí son los gastos del mes. También es aquí donde descarga los archivos 606 y 607 para el contador (DGII).",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 4, kind: "text", label: "junio de 2026", hotspot: 1 },
            { w: 8, kind: "toolbar", label: "◀  mes ▼  ▶" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Ingresos", hotspot: 2 },
            { w: 3, kind: "kpi", label: "Coste de ventas" },
            { w: 3, kind: "kpi", label: "Gastos" },
            { w: 3, kind: "kpi", label: "Resultado neto" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "text", label: "Exportar DGII" },
            { w: 4, kind: "button", label: "606 · Compras", hotspot: 3 },
            { w: 5, kind: "button", label: "607 · Ventas (borrador)" },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "01 · Resultado del mes", hotspot: 4 },
            { w: 5, kind: "panel", label: "Ventas por canal", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "02 · Gastos — registro + lista", hotspot: 6 },
            { w: 5, kind: "panel", label: "Gastos por categoría" },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "03 · Márgenes por producto", hotspot: 7 }],
        },
        {
          blocks: [
            { w: 5, kind: "panel", label: "04 · Inventario valorizado", hotspot: 8 },
            { w: 7, kind: "panel", label: "Compras del mes (606)", hotspot: 9 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Mes mostrado",
        desc: "El título indica el mes que se está mostrando. Las flechas pasan al mes anterior o al siguiente (la flecha «siguiente» queda bloqueada en el mes en curso), y el menú desplegable lista los últimos 12 meses. Toda la pantalla se recalcula para el mes elegido.",
      },
      {
        n: 2,
        label: "Las 4 cifras clave",
        desc: "Ingresos = ventas cobradas del mes (monto, unidades, número de ventas). Coste de ventas = costo de los productos vendidos, con el porcentaje de la facturación cuyo costo se conoce. Gastos = total de los gastos registrados. Resultado neto = ingresos menos coste de ventas menos gastos; la tarjeta se muestra en alerta si el mes está en pérdida.",
      },
      {
        n: 3,
        label: "Descargas DGII",
        desc: "Dos botones que descargan un archivo CSV (para abrir en Excel) del mes mostrado: el 606 (registro de compras, reconstruido a partir de las recepciones de stock) y el 607 (diario de ventas cobradas, entregado como borrador).",
      },
      {
        n: 4,
        label: "Resultado del mes",
        desc: "El estado de resultados línea por línea: Ingresos − Coste de ventas = Margen bruto, luego − Gastos = Resultado neto. Debajo: la barra «Cobertura de coste» (parte de la facturación cuyo costo se conoce) y la comparación con el mes anterior (Δ en porcentaje).",
      },
      {
        n: 5,
        label: "Ventas por canal",
        desc: "Distribución de los ingresos cobrados entre los tres canales: Mostrador (venta en el mostrador), Web invitado (reserva sin cuenta) y Cuenta cliente (reserva con cuenta). Cada barra muestra el monto y el número de ventas.",
      },
      {
        n: 6,
        label: "Registro y lista de gastos",
        desc: "El único lugar de la pantalla donde usted modifica algo: un formulario (monto, categoría, fecha, descripción opcional) con el botón «Añadir», y la lista de los gastos del mes, cada uno con un ícono de papelera para eliminarlo.",
      },
      {
        n: 7,
        label: "Márgenes por producto",
        desc: "Tabla de los productos vendidos en el mes: unidades, ingresos, costo y margen en porcentaje. Debajo, los productos con menor margen. La tabla permanece vacía mientras ninguna venta del mes tenga un costo conocido — se llena con las ventas cobradas DESPUÉS de sus primeras recepciones en la pantalla Stock (el costo queda fijado en el momento del cobro; las ventas ya cobradas no se recalculan).",
      },
      {
        n: 8,
        label: "Inventario valorizado",
        desc: "Foto del stock actual (no solo del mes mostrado): valor al costo de compra, valor al precio de venta, número de unidades y cuántos productos activos tienen un costo registrado. Los productos sin costo conocido no se cuentan como cero: simplemente se excluyen del valor al costo.",
      },
      {
        n: 9,
        label: "Compras del mes",
        desc: "Resumen de las recepciones de stock registradas en el mes: total comprado, base imponible e ITBIS estimados (18 %), número de líneas de entrada (cada producto recibido cuenta como una línea) y de unidades, principales proveedores. Una advertencia cuenta las líneas sin NCF: saldrán con la casilla NCF vacía en el archivo 606 — el NCF ya no puede añadirse después; guarde las facturas para el contador.",
      },
    ],
    workflows: [
      {
        title: "Registrar un gasto (alquiler, salario, factura…)",
        steps: [
          {
            title: "Abra la sección «Gastos operativos»",
            body: "En la pantalla Contabilidad, baje hasta el bloque 02. El formulario de registro está en la parte superior del panel izquierdo.",
          },
          {
            title: "Complete el formulario",
            body: "Monto en pesos (obligatorio, mayor que cero), categoría (alquiler, salarios, servicios…), fecha (hoy por defecto) y descripción opcional, por ejemplo «Alquiler de junio».",
          },
          {
            title: "Haga clic en «Añadir»",
            body: "Un mensaje «Gasto registrado» confirma el registro. El gasto se escribe en la base de datos y queda anotado en el registro de auditoría.",
          },
          {
            title: "Verifique el resultado",
            body: "La línea aparece en la lista, el total «Gastos del mes» aumenta y el «Resultado neto» disminuye en esa misma cantidad. Si la fecha elegida cae en otro mes, cambie de mes para ver la línea.",
          },
        ],
      },
      {
        title: "Hacer el balance a fin de mes",
        steps: [
          {
            title: "Elija el mes",
            body: "Con las flechas o el menú desplegable en la parte superior de la pantalla. Todas las cifras se recalculan para ese mes.",
          },
          {
            title: "Lea las 4 tarjetas de arriba",
            body: "Ingresos, coste de ventas, gastos, resultado neto. Una tarjeta roja en el resultado neto señala un mes en pérdida.",
          },
          {
            title: "Controle la cobertura de costo",
            body: "Si la barra «Cobertura de coste» está por debajo del 100 %, una parte de las ventas no tiene costo conocido: el margen se calcula solo sobre una parte, y el resultado neto es más optimista que la realidad. Registre sus recepciones en la pantalla Stock para corregirlo en las ventas futuras.",
          },
          {
            title: "Compare con el mes anterior",
            body: "Debajo del estado de resultados, las líneas «Δ vs mes anterior» muestran la evolución de los ingresos, del coste de ventas y del margen bruto.",
          },
          {
            title: "Revise los márgenes por producto",
            body: "La tabla del bloque 03 destaca los productos que más dejan, y la fila «Menor margen» aquellos cuyo margen es más bajo (aunque se vendan bien) — útil para ajustar los precios.",
          },
        ],
      },
      {
        title: "Preparar los archivos para el contador (DGII)",
        steps: [
          {
            title: "Muestre el mes cerrado",
            body: "Seleccione el mes correspondiente en la parte superior de la pantalla.",
          },
          {
            title: "Verifique el recuadro «Compras del mes»",
            body: "Si una advertencia indica recepciones sin NCF, busque las facturas de proveedor correspondientes: esas líneas saldrán con el NCF vacío en el archivo 606.",
          },
          {
            title: "Descargue el 606 (compras)",
            body: "Una línea por recepción: proveedor, RNC, NCF, fecha de factura, base imponible e ITBIS por separado. Los productos recibidos juntos se agrupan en la misma línea.",
          },
          {
            title: "Descargue el 607 (ventas)",
            body: "El diario de ventas cobradas del mes, con la fecha, la referencia, el canal, el cliente y el monto. Es un borrador: la columna NCF está vacía.",
          },
          {
            title: "Entréguelos al contador",
            body: "Envíe los dos archivos aclarando que el 607 es un diario interno sin comprobantes fiscales: le corresponde al contador decidir cómo declararlo.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Añadir (registrar un gasto)",
        where: "Bloque 02 «Gastos operativos», formulario en la parte superior del panel «Registrar y revisar gastos»",
        does: "Registra un gasto (monto, categoría, fecha, descripción) en la contabilidad.",
        effects: [
          "El gasto se escribe definitivamente en la base de datos, con su identidad como autor.",
          "Cuenta en el mes de la fecha elegida (no necesariamente el mes mostrado): la lista, el total «Gastos del mes» y el resultado neto de ese mes se recalculan de inmediato.",
          "El desglose «Gastos por categoría» se actualiza.",
          "El monto debe ser mayor que cero; la descripción se limita a 200 caracteres; la categoría «Mermas y pérdidas» no se ofrece (está reservada a las pérdidas declaradas desde la pantalla Stock).",
        ],
        severity: "caution",
        undo: "Elimine la línea con el ícono de papelera en la lista justo debajo.",
        audited: true,
        accountingImpact: "Añade un gasto al mes de la fecha elegida: el resultado neto de ese mes disminuye en esa misma cantidad.",
      },
      {
        label: "Ícono de papelera (eliminar un gasto)",
        where: "Bloque 02, a la derecha de cada línea de la lista de gastos",
        does: "Elimina definitivamente el gasto de la contabilidad, sin pedir confirmación.",
        effects: [
          "La línea se borra de la base de datos de inmediato — no hay papelera de recuperación.",
          "El total de gastos, el desglose por categoría y el resultado neto del mes se recalculan de inmediato.",
          "Si la línea eliminada es una «Mermas y pérdidas» (creada automáticamente por una pérdida de stock), el stock NO se repone: la pérdida queda registrada en el inventario, solo el gasto desaparece de la contabilidad. El registro de pérdidas conserva su rastro, pero el vínculo con el gasto se rompe.",
        ],
        severity: "danger",
        undo: "Vuelva a registrar un gasto idéntico (mismo monto, categoría y fecha). Excepción: una línea «Mermas y pérdidas» no se puede recrear a mano — elimínela solo en caso de error comprobado.",
        audited: true,
        accountingImpact: "Quita el gasto del mes correspondiente: el resultado neto sube en esa misma cantidad.",
      },
      {
        label: "606 · Compras (descargar)",
        where: "Debajo de las 4 tarjetas, fila «Exportar DGII»",
        does: "Descarga el registro de compras del mes mostrado, en formato CSV (legible en Excel).",
        effects: [
          "No modifica nada: es una simple descarga, que puede repetirse cuantas veces quiera.",
          "El archivo reconstruye las compras a partir de las recepciones de stock registradas en el mes: una línea por recepción (proveedor, RNC, NCF, fecha de factura, base imponible, ITBIS, total).",
          "Si la recepción se marcó con «Precios con ITBIS incluido», el archivo separa la base y el impuesto (18 %); si no, el monto se trata como exento (ITBIS en cero).",
          "Las recepciones sin NCF salen con la casilla NCF vacía — la pantalla se lo advierte en el recuadro «Compras del mes».",
        ],
        severity: "safe",
      },
      {
        label: "607 · Ventas (borrador) (descargar)",
        where: "Debajo de las 4 tarjetas, fila «Exportar DGII»",
        does: "Descarga el diario de ventas cobradas del mes mostrado, en formato CSV — como borrador.",
        effects: [
          "No modifica nada: es una simple descarga, que puede repetirse cuantas veces quiera.",
          "Una línea por venta cobrada: fecha de cobro, referencia, canal (Mostrador / Web / Cuenta), nombre del cliente y monto total.",
          "La columna NCF está vacía en todas las líneas: la farmacia todavía no emite comprobantes fiscales. Este archivo es un diario interno, no una declaración lista para presentar.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Solo las ventas COBRADAS cuentan en la facturación (reservas marcadas como «Entregada» y ventas en el mostrador). Una reserva pendiente o confirmada todavía no cuenta — y una venta cuenta en el mes de su cobro, no en el mes en que se creó la reserva.",
      "Un costo desconocido nunca se cuenta como cero: una venta cuyo producto no tiene costo registrado simplemente se excluye del coste de ventas y del margen. La barra «Cobertura de coste» indica la parte de la facturación cuyo costo se conoce — mientras esté por debajo del 100 %, el resultado neto es más optimista que la realidad.",
      "La categoría «Mermas y pérdidas» se alimenta sola cuando usted declara una pérdida (producto vencido, dañado, robado) en la pantalla Stock. No aparece en el formulario de registro: es imposible crearla a mano.",
      "Eliminar una línea «Mermas y pérdidas» no repone el producto en stock: la pérdida queda registrada en el inventario, solo desaparece el gasto contable. Hágalo únicamente en caso de error real.",
      "Una recepción de stock cuenta en el mes en que se registró en la pantalla Stock, no en el de la factura del proveedor (la fecha de factura figura de todos modos en el archivo 606).",
      "Una recepción registrada ya no se modifica: proveedor, RNC, NCF y fecha de factura quedan fijados al registrarla. Verifíquelos al momento de registrar la recepción en la pantalla Stock — una recepción sin NCF saldrá para siempre con la casilla vacía en el 606.",
      "El 607 es un borrador: NCF vacío en todas las líneas. No lo presente tal cual a la DGII — entrégueselo al contador.",
      "Aparte de los gastos, nada se puede modificar en esta pantalla: para corregir una cifra, actúe en la fuente (pantalla Stock para las recepciones y las pérdidas, pantalla Ventas para los cobros).",
      "Esta pantalla se muestra en español sea cual sea el idioma elegido para el panel de administración.",
    ],
  },
]
