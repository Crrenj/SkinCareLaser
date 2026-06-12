import type { TutoContent } from './types'
import { orderSections } from './assemble'
import { sections as dashboard } from './sections/es/dashboard'
import { sections as contabilidad } from './sections/es/contabilidad'
import { sections as products } from './sections/es/products'
import { sections as brands } from './sections/es/brands'
import { sections as stock } from './sections/es/stock'
import { sections as tags } from './sections/es/tags'
import { sections as promotions } from './sections/es/promotions'
import { sections as reservations } from './sections/es/reservations'
import { sections as ventas } from './sections/es/ventas'
import { sections as messagesNewsletter } from './sections/es/messages-newsletter'
import { sections as homeBlog } from './sections/es/home-blog'
import { sections as usersReviews } from './sections/es/users-reviews'
import { sections as settingsAppearance } from './sections/es/settings-appearance'
import { sections as adminsLogs } from './sections/es/admins-logs'
import { sections as concepts } from './sections/es/concepts'

export const es: TutoContent = {
  intro: {
    title: 'Cómo leer esta guía',
    body: [
      'Esta guía describe cada pantalla del panel de administración: para qué sirve, qué hace cada botón y, sobre todo, qué pasa después — en el sitio público, en el stock, en la contabilidad.',
      'Cada sección empieza por lo esencial en una frase. ¿Necesita más? Despliegue: el esquema de la pantalla, los procedimientos y la lista de acciones con sus consecuencias. Las secciones « Navegación » y « Conceptos clave » se leen primero; el resto se consulta cuando haga falta, en el orden del menú de la izquierda.',
      'Antes de cualquier acción que todavía no conozca, mire su nivel de riesgo y la línea « Para deshacer »: algunas operaciones no tienen vuelta atrás.',
    ],
    severityLegend: {
      safe: 'Sin riesgo — se deshace en un clic, sin efecto fuera del panel.',
      caution: 'Atención — visible para los clientes o la contabilidad, o difícil de deshacer.',
      danger: 'Peligro — irreversible: se pueden perder datos definitivamente.',
    },
  },
  groups: [
    { label: 'Para empezar', ids: ['chrome', 'concepts'] },
    { label: 'Pilotaje', ids: ['dashboard', 'contabilidad'] },
    { label: 'Catálogo', ids: ['products', 'brands', 'stock', 'tags', 'promotions'] },
    { label: 'Actividad', ids: ['reservations', 'ventas', 'messages'] },
    { label: 'Contenido', ids: ['home', 'blog'] },
    { label: 'Clientes', ids: ['users', 'reviews', 'newsletter'] },
    { label: 'Ajustes', ids: ['settings', 'appearance'] },
    { label: 'Acceso', ids: ['admins', 'logs'] },
  ],
  summaries: {
    chrome:
      'Dos referencias presentes en todas las páginas: la barra lateral a la izquierda (el menú, sus contadores, su tarjeta de identidad) y la cabecera arriba.',
    concepts:
      'Tres hilos conductores explican casi todo el panel: el recorrido de un pedido, la vida de un precio y la vida de un coste.',
    dashboard:
      'La página de llegada tras la conexión: toda la farmacia de un vistazo, en solo lectura — hacer clic en una tarjeta lleva a la pantalla correspondiente.',
    contabilidad:
      'El balance financiero del mes: ingresos, coste de los productos vendidos, gastos y resultado neto — casi todo se calcula automáticamente.',
    products:
      'El corazón del catálogo: crear una ficha de producto, corregir un nombre o un precio, gestionar las fotos y la visibilidad en el sitio.',
    brands:
      'El catálogo se organiza en dos niveles — cada marca contiene gamas, y cada producto está vinculado a una gama.',
    stock:
      'Las cantidades en estantería y las cuatro operaciones de inventario: recepción, ajuste, pérdida, inicialización. Aquí vive el coste medio.',
    tags: 'Las etiquetas clasifican los productos por tema (necesidades, tipos de piel, ingredientes…) y alimentan los filtros del catálogo público.',
    promotions:
      'Descuentos con fechas (− % o importe fijo) sobre productos, una marca o una gama — mostrados como precio tachado en el sitio.',
    reservations:
      'La bandeja de entrada de las solicitudes de clientes: contactar, confirmar, ajustar un precio si hace falta, y marcar « Entregada » al cobrar.',
    ventas:
      'El registro de todo lo realmente vendido y entregado al cliente — reservas entregadas y ventas directas de mostrador.',
    messages:
      'Los mensajes del formulario de contacto y del centro de ayuda llegan aquí como tickets: leer, responder, cerrar.',
    home: 'Todo lo que se muestra en la página de inicio del sitio: orden y visibilidad de las secciones, banners promocionales, y vista previa.',
    blog: 'Escribir, publicar y retirar los artículos del blog del sitio público — cada artículo se redacta en un solo idioma.',
    users:
      'Todas las cuentas registradas en el sitio: los clientes, y los miembros del equipo (cuentas de cliente con permisos adicionales).',
    reviews:
      'Moderar las reseñas de productos (nota de 1 a 5 estrellas) que los clientes dejan al pie de las fichas del sitio.',
    newsletter:
      'La lista de personas suscritas a la newsletter, con su idioma, su fecha de alta y su estado de confirmación.',
    settings:
      'La información oficial de la tienda: datos de contacto, punto de recogida y reglas de reserva.',
    appearance:
      'El aspecto visual del sitio público: una paleta entre seis, el modo claro/oscuro por defecto y el interruptor que se deja al visitante.',
    admins:
      'Gestionar el equipo con acceso al panel: dos roles, y la promoción (o retirada) del sombrero de admin de una cuenta de cliente.',
    logs: 'El registro de auditoría: quién creó, modificó o eliminó qué, y cuándo — con los campos afectados y sus nuevos valores.',
  },
  sections: orderSections([
    dashboard,
    contabilidad,
    products,
    brands,
    stock,
    tags,
    promotions,
    reservations,
    ventas,
    messagesNewsletter,
    homeBlog,
    usersReviews,
    settingsAppearance,
    adminsLogs,
    concepts,
  ]),
}
