import type { TutoSection } from "../../types"

export const sections: TutoSection[] = [
  {
    id: "dashboard",
    navLabel: "Dashboard",
    title: "Overview — the dashboard",
    route: "/admin",
    intro:
      "This is the admin home page: you land on it right after signing in. It shows the whole pharmacy at a glance — reservations, revenue, stock, catalogue, customers, messages — without changing anything. Everything here is read-only: clicking a tile or a card simply takes you to the relevant page. The figures are calculated the moment the page is displayed.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Overview · today's date", hotspot: 1 },
            { w: 2, kind: "button", label: "+ Product" },
            { w: 2, kind: "button", label: "Search" },
          ],
        },
        {
          blocks: [
            { w: 2, kind: "kpi", label: "Products", hotspot: 2 },
            { w: 2, kind: "kpi", label: "Reservations" },
            { w: 2, kind: "kpi", label: "Stock!", hotspot: 3 },
            { w: 2, kind: "kpi", label: "Messages!" },
            { w: 2, kind: "kpi", label: "Customers" },
            { w: 2, kind: "kpi", label: "Carts" },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "panel", label: "01 · Reservations — 7-day chart", hotspot: 4 },
            { w: 4, kind: "panel", label: "By status", hotspot: 5 },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "Recent reservations", hotspot: 6 }],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "02 · Catalogue readiness", hotspot: 7 },
            { w: 5, kind: "panel", label: "Inventory", hotspot: 8 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "03 · Customers", hotspot: 9 },
            { w: 4, kind: "panel", label: "Activity" },
            { w: 4, kind: "panel", label: "Content" },
          ],
        },
        {
          blocks: [{ w: 12, kind: "table", label: "Quick links (13 shortcuts)", hotspot: 10 }],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Header",
        desc: "Breadcrumb “Admin / Overview”, title with today's date, and two buttons on the right: “Add product” and “Search”. Both lead to the Products page; the creation form does not open by itself — once there, click the “Add product” button on the Products page.",
      },
      {
        n: 2,
        label: "Band of 6 tiles",
        desc: "The pharmacy's pulse: active products (with the number of brands and ranges), active reservations (pending + confirmed, with the confirmed total in DOP), critical stock, unread messages, registered customers (with this week's newcomers) and open carts. Every tile except “Carts” is clickable and leads to the relevant page.",
      },
      {
        n: 3,
        label: "Alert ring",
        desc: "When something needs action, the tile's outline turns a reddish alert colour. Two tiles can light up: “Critical stock” (at least one active product under 5 units, sold-out included) and “Unread messages” (at least one open message).",
      },
      {
        n: 4,
        label: "Reservations chart (7 days)",
        desc: "Two lines: “Reserved” = the total of all reservations created each day (except cancelled ones); “Confirmed” = the share of those reservations now confirmed or collected. The arrows compare with the previous week, and the conversion rate shows how much of what is reserved actually goes through.",
      },
      {
        n: 5,
        label: "Reservations by status",
        desc: "The 5 statuses (pending, confirmed, collected, expired, cancelled) with their count and amount. Above them: the confirmed revenue (confirmed + collected reservations) and the average basket — careful, those two figures cover ALL reservations since opening, not just the week.",
      },
      {
        n: 6,
        label: "Recent reservations",
        desc: "The last 5 reservations: reference, customer name, origin (account, web without an account, or counter), status and amount. Clicking a row opens the Reservations page — the reservation is not preselected there, find it by its reference. Reservations already collected are viewed on the Sales page.",
      },
      {
        n: 7,
        label: "Catalogue readiness",
        desc: "An average completeness score for the product sheets, followed by 7 bars: image, configured price, volume, benefits, pharmacist's advice, ingredient list and technical PDF sheet. Green = well covered, red = nearly empty. Below this card you will also find the breakdown by brand, the top products of the last 30 days and the critical stock list.",
      },
      {
        n: 8,
        label: "Inventory",
        desc: "Total units in stock, stock value at selling price, and the product breakdown: in stock (5 units or more), low stock (1 to 4) and sold out (0). An orange warning flags products still at the provisional 100 DOP price, never configured.",
      },
      {
        n: 9,
        label: "Customers and activity",
        desc: "Three cards: Customers (total accounts, new over 7 and 30 days, share with a phone number, preferred language), Activity (carts containing items, favourites, newsletter sign-ups and confirmed ones) and Content (published blog posts, active banners, tags). Further down: the last 5 messages received.",
      },
      {
        n: 10,
        label: "Quick links",
        desc: "13 shortcuts to the main admin sections (some pages, such as Accounting, Promotions or Sales, are not listed there: use the left-hand menu). The first one, “Añadir producto”, leads to the Products page; the creation form opens from that page's button.",
      },
    ],
    workflows: [
      {
        title: "Take stock at the start of the day",
        steps: [
          {
            title: "Open the Overview",
            body: "It is the page you land on after signing in. Let it load fully: all the figures are calculated at that moment.",
          },
          {
            title: "Read the tile band",
            body: "Spot the tiles with a reddish outline first: they flag critical stock or unread messages to deal with.",
          },
          {
            title: "Deal with critical stock",
            body: "Click the “Stock crítico” tile to open the Stock page and restock or deactivate the affected products.",
          },
          {
            title: "Go through recent reservations",
            body: "Make sure no pending reservation is left hanging: they expire automatically after 24 hours without action.",
          },
          {
            title: "Answer messages",
            body: "Click the “Mensajes sin leer” tile or a message at the bottom of the page to open the inbox (“Support” menu).",
          },
        ],
      },
      {
        title: "Check the catalogue's health",
        steps: [
          {
            title: "Read the readiness score",
            body: "The big percentage on the “Preparación del catálogo” card shows the average completeness of the product sheets. The greener it is, the more presentable the catalogue.",
          },
          {
            title: "Spot what is missing",
            body: "Each bar shows how many sheets have an image, a configured price, a volume, benefits, advice, ingredients or a PDF sheet.",
          },
          {
            title: "Watch the provisional prices",
            body: "The orange box on the “Inventario” card counts products still at 100 DOP: that placeholder price shows as-is on the public site until it is replaced.",
          },
          {
            title: "Complete the sheets",
            body: "Open the Products page (“Search” button or “Productos activos” tile) and complete the sheets one by one.",
          },
        ],
      },
      {
        title: "Follow the week's sales",
        steps: [
          {
            title: "Compare Reserved and Confirmed",
            body: "On the chart, the gap between the two lines shows the reservations that are not going through yet.",
          },
          {
            title: "Look at the trend arrows",
            body: "Green arrow pointing up: better than the previous week. Red arrow pointing down: worse.",
          },
          {
            title: "Spot the products that sell",
            body: "The “Top productos” card ranks the 4 most collected products over 30 days, in units and in DOP.",
          },
          {
            title: "Open the detail",
            body: "The “Ver detalle” and “Ver todas” links lead to the Reservations page to act on each case.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Add product",
        where: "Page header, to the right of the title",
        does: "Takes you to the Products page, where you can create the product.",
        effects: [
          "You leave the dashboard for the Products page.",
          "The creation form does not open by itself: click the “Add product” button on the Products page.",
          "Nothing is saved until you submit that form.",
        ],
        severity: "safe",
        undo: "Go back or open another page: no data is created.",
      },
    ],
    flows: [
      {
        title: "Reservation statuses as shown on the dashboard",
        lanes: [
          [
            {
              label: "Pending (“Reservada”)",
              tone: "neutral",
              note: "The customer has just reserved. Without action on your side, the reservation expires on its own after 24 hours.",
            },
            {
              label: "Confirmed (“Confirmada”)",
              tone: "neutral",
              note: "You confirmed to the customer that their order is waiting at the pharmacy.",
            },
            {
              label: "Collected (“Entregada”)",
              tone: "ok",
              note: "The customer came by: stock is deducted at that moment and the sale enters the accounting. Its amount already counted in the “confirmed revenue” from confirmation onwards.",
            },
          ],
          [
            { label: "Pending", tone: "neutral" },
            {
              label: "Expired (“Expirada”)",
              tone: "warn",
              note: "24 hours with no follow-up: the reservation closes automatically, without touching stock.",
            },
          ],
          [
            { label: "Pending or confirmed", tone: "neutral" },
            {
              label: "Cancelled (“Cancelada”)",
              tone: "bad",
              note: "The reservation is cancelled: it counts neither in the confirmed revenue nor in the average basket.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "The texts inside the dashboard cards are in Spanish, whatever language is chosen at the top of the page. Only the menu, the breadcrumb, the title and the header buttons follow your language.",
      "“Valor stock” is the stock value at SELLING price (price × units). The value at purchase cost is found in Accounting.",
      "The “en promo” chip counts products whose sheet carries a manually entered old crossed-out price — not the campaigns from the Promotions page.",
      "“Top productos” only counts reservations actually collected over the last 30 days. A reservation that is pending or confirmed but not yet collected does not appear there.",
      "“Ingreso confirmado” (confirmed revenue) and “cesta media” (average basket), on the “Reservas por estado” card, cover all reservations since opening, not just the 7 days of the neighbouring chart.",
      "The letters under the chart (L, M, M, J, V, S, D) do not always match the real days: the chart actually covers the last 7 days, the rightmost point being today.",
      "The dashboard treats a price of exactly 100 DOP as a provisional, never-configured price: that is what the orange warning on the “Inventario” card counts.",
      "The figures are frozen the moment the page is displayed. Reload the page to refresh them.",
      "The recent-reservations legend mentions a 💬 marker (“the customer opened WhatsApp”), but it never shows: that information is not recorded anywhere for now.",
    ],
  },
  {
    id: "chrome",
    navLabel: "General navigation",
    title: "Finding your way: sidebar and header",
    route: "/admin",
    intro:
      "Two elements follow you across every admin page: the sidebar on the left (the menu, with its counters and your identity card) and the header at the top of each page (the breadcrumb, the title, the language selector and the light/dark mode). This section explains how to read them and what their buttons do.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 3, kind: "panel", label: "FARMAU · Admin", hotspot: 1 },
            { w: 9, kind: "toolbar", label: "Breadcrumb / Title — FR ES EN · light/dark", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Menu: 6 groups + badges", hotspot: 3 },
            { w: 9, kind: "panel", label: "Page content" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "Identity card · sign out", hotspot: 4 },
            { w: 9, kind: "panel" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "panel", label: "View site · My account", hotspot: 5 },
            { w: 9, kind: "panel" },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Logo and Admin badge",
        desc: "At the top of the sidebar, “FARMAU” always takes you back to the Overview. The “Admin” badge reminds you that you are on the admin side, not on the public site.",
      },
      {
        n: 2,
        label: "Page header",
        desc: "Present on every page: the breadcrumb in small capitals (the previous items are clickable), the page title, then the tools — FR/ES/EN language selector and light/dark toggle — and finally the page's own buttons (for example “Add product”).",
      },
      {
        n: 3,
        label: "Menu by groups",
        desc: "Six groups: General (Overview, Accounting, User guide), Catalogue (Products, Brands, Stock, Tags, Promotions), Operations (Reservations, Sales, Support, Homepage, Blog), Customers (Users, Reviews, Newsletter), Configuration (Shop, Appearance) and Access (Administrators, Activity log). The current page is highlighted with a coloured rule on the left. Some entries carry a badge: a grey counter on Products (number of active products) and brightly coloured badges on Stock (products under 5 units), Reservations (pending or confirmed, to deal with) and Support (open messages).",
      },
      {
        n: 4,
        label: "Identity card and sign-out",
        desc: "At the bottom of the menu: a circle with your initials, your display name (or the start of your email address if you have none), the “Admin” label, and on the right an exit icon to sign out.",
      },
      {
        n: 5,
        label: "Bridges to the customer side",
        desc: "“View site” opens the public shop in a new tab, in the language currently chosen for the admin. “My account” leads to your personal profile (display name, phone, password) — your administrator account is also a normal customer account.",
      },
    ],
    workflows: [
      {
        title: "Change the admin language",
        steps: [
          {
            title: "Find the selector",
            body: "In the header of any admin page, to the right of the title, three buttons: FR, ES, EN.",
          },
          {
            title: "Click the language you want",
            body: "The page reloads in the new language. The active language sits on a light background and cannot be clicked.",
          },
          {
            title: "It is remembered",
            body: "The choice is kept on this browser for a year: every admin page will show in that language, until your next change.",
          },
        ],
      },
      {
        title: "Check the site as a customer",
        steps: [
          {
            title: "Click “View site”",
            body: "At the bottom of the sidebar. The shop opens in a new tab: your admin tab stays open.",
          },
          {
            title: "Browse freely",
            body: "You are signed in with the same account: you can try the cart, the favourites, a reservation, like any customer.",
          },
          {
            title: "Come back to the admin",
            body: "Close the shop tab or simply return to the previous tab. Nothing has changed on the admin side.",
          },
        ],
      },
      {
        title: "Read the menu alerts",
        steps: [
          {
            title: "Brightly coloured badges = to deal with",
            body: "Stock (products dropping under 5 units), Reservations (pending or confirmed, not yet collected) and Support (open messages).",
          },
          {
            title: "Grey badge = plain counter",
            body: "On Products, the grey badge shows the number of active products in the catalogue. It is not an alert.",
          },
          {
            title: "Counters refresh as you navigate",
            body: "They update on every page change, possibly with a slight delay. Above 99, they show “99+”.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "FR · ES · EN (language selector)",
        where: "Header of every admin page, to the right of the title",
        does: "Changes the language of the admin menus and pages, and nothing else.",
        effects: [
          "The preference is saved on this browser for a year.",
          "The page reloads immediately in the new language.",
          "The public site is not affected: each visitor picks their own language there.",
          "Other administrators and other computers are not affected.",
        ],
        severity: "safe",
        undo: "Click another language: the change is immediate.",
      },
      {
        label: "Sun / Moon (light or dark mode)",
        where: "Header of every admin page, next to the language selector",
        does: "Switches the admin display between light mode and dark mode.",
        effects: [
          "The admin changes appearance immediately, without reloading.",
          "The choice is remembered on this device and this browser only.",
          "The public site and the other administrators see no change.",
        ],
        severity: "safe",
        undo: "Click the other icon to return to the previous mode.",
      },
      {
        label: "Sign out (exit icon)",
        where: "At the bottom of the sidebar, to the right of your name",
        does: "Closes your session and sends you back to the login page.",
        effects: [
          "Your session is closed on this browser.",
          "Since your administrator account is also your customer account, you are signed out of the public site at the same time on this browser.",
          "No one can use the admin on this computer without signing in again.",
        ],
        severity: "safe",
        undo: "Sign back in with your email address and password.",
      },
    ],
    gotchas: [
      "The FR/ES/EN selector only changes the language of the ADMIN. On the public site, the language is part of the page address and each visitor picks their own.",
      "The light/dark mode in the header is specific to your device. The colour PALETTE, on the other hand, is set in Appearance and applies to the public site AND the admin, for everyone.",
      "Signing out closes the whole account on this browser: you are also signed out of the shop side (a single account serves both hats).",
      "The name shown on the identity card is your profile display name; you change it via “My account”. Without one, the start of your email address is shown.",
      "The menu badges refresh when you change pages, possibly with a slight delay: a counter can stay visible a few seconds after you have dealt with the item.",
      "The Stock badge counts active products under 5 units, including products that are completely sold out.",
      "There is no profile page in the admin: your personal profile is managed on the shop side, via the “My account” link.",
    ],
  },
]
