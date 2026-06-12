import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "contabilidad",
    navLabel: "Accounting",
    title: "Accounting — the month's results",
    route: "/admin/contabilidad",
    intro:
      "This screen sums up a month's finances: what the pharmacy collected, what the products sold cost, the expenses (rent, salaries…) and the net result. Almost everything is read-only: the figures are calculated automatically from collected sales, stock receptions and declared losses. The only thing you enter here is the month's expenses. This is also where you download the 606 and 607 files for the accountant (DGII).",
    mockup: {
      rows: [
        {
          blocks: [{ w: 12, kind: "text", label: "Admin / General / Contabilidad" }],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "junio de 2026", hotspot: 1 },
            { w: 8, kind: "toolbar", label: "◀  month ▼  ▶" },
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
            { w: 7, kind: "panel", label: "02 · Gastos — entry + list", hotspot: 6 },
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
        label: "Displayed month",
        desc: "The title shows the month currently displayed. The arrows move to the previous or next month (the “next” arrow is blocked on the current month), and the dropdown lists the last 12 months. The whole screen recalculates for the chosen month.",
      },
      {
        n: 2,
        label: "The 4 key figures",
        desc: "Ingresos = collected sales for the month (amount, units, number of sales). Coste de ventas = cost of the products sold, with the percentage of revenue whose cost is known. Gastos = total of the expenses entered. Resultado neto = revenue minus cost of sales minus expenses; the tile shows an alert if the month is at a loss.",
      },
      {
        n: 3,
        label: "DGII downloads",
        desc: "Two buttons that download a CSV file (open it in Excel) for the displayed month: the 606 (purchase register, rebuilt from stock receptions) and the 607 (journal of collected sales, provided as a draft).",
      },
      {
        n: 4,
        label: "Resultado del mes",
        desc: "The income statement line by line: Revenue − Cost of sales = Gross margin, then − Expenses = Net result. Below it: the “Cobertura de coste” gauge (share of revenue whose cost is known) and the comparison with the previous month (Δ as a percentage).",
      },
      {
        n: 5,
        label: "Ventas por canal",
        desc: "Breakdown of collected revenue across the three channels: Mostrador (counter sale), Web invitado (reservation without an account) and Cuenta cliente (reservation with an account). Each bar shows the amount and the number of sales.",
      },
      {
        n: 6,
        label: "Expense entry and list",
        desc: "The only place on the screen where you change anything: a form (amount, category, date, optional description) with the “Añadir” button, and the list of the month's expenses, each with a trash icon to delete it.",
      },
      {
        n: 7,
        label: "Márgenes por producto",
        desc: "Table of the products sold during the month: units, revenue, cost and margin as a percentage. Below it, the lowest-margin products. The table stays empty as long as no sale of the month has a known cost — it fills up with sales collected AFTER your first receptions in the Stock screen (the cost is frozen at collection time; already collected sales are not recalculated).",
      },
      {
        n: 8,
        label: "Inventario valorizado",
        desc: "Snapshot of the current stock (not just the displayed month): value at purchase cost, value at sale price, number of units, and how many active products have a recorded cost. Products without a known cost are not counted as zero: they are simply excluded from the value at cost.",
      },
      {
        n: 9,
        label: "Compras del mes",
        desc: "Summary of the stock receptions entered during the month: total purchased, estimated taxable base and ITBIS (18%), number of entry lines (each product received counts as one line) and units, main suppliers. A warning counts the lines without an NCF: they will come out with an empty NCF cell in the 606 file — the NCF can no longer be added afterwards; keep the invoices for the accountant.",
      },
    ],
    workflows: [
      {
        title: "Record an expense (rent, salary, invoice…)",
        steps: [
          {
            title: "Open the “Gastos operativos” section",
            body: "On the Accounting screen, scroll down to block 02. The entry form is at the top of the left panel.",
          },
          {
            title: "Fill in the form",
            body: "Amount in pesos (required, greater than zero), category (rent, salaries, services…), date (today by default) and an optional description, for example “Alquiler de junio”.",
          },
          {
            title: "Click “Añadir”",
            body: "A “Gasto registrado” message confirms the entry. The expense is written to the database and traced in the audit log.",
          },
          {
            title: "Check the result",
            body: "The line appears in the list, the “Gastos del mes” total goes up and the “Resultado neto” goes down by the same amount. If the chosen date falls in another month, switch months to see the line.",
          },
        ],
      },
      {
        title: "Review the month at month-end",
        steps: [
          {
            title: "Choose the month",
            body: "Use the arrows or the dropdown at the top of the screen. All the figures recalculate for that month.",
          },
          {
            title: "Read the 4 tiles at the top",
            body: "Revenue, cost of sales, expenses, net result. A red tile on the net result flags a month at a loss.",
          },
          {
            title: "Check the cost coverage",
            body: "If the “Cobertura de coste” gauge is below 100%, part of the sales have no known cost: the margin is calculated on only part of them, and the net result is more optimistic than reality. Record your receptions in the Stock screen to fix this for future sales.",
          },
          {
            title: "Compare with the previous month",
            body: "Below the income statement, the “Δ vs mes anterior” lines show how revenue, cost of sales and gross margin evolved.",
          },
          {
            title: "Go through the margins per product",
            body: "The table in block 03 highlights the products that bring in the most, and the “Menor margen” row those with the lowest margin (even if they sell well) — useful for adjusting prices.",
          },
        ],
      },
      {
        title: "Prepare the files for the accountant (DGII)",
        steps: [
          {
            title: "Display the closed month",
            body: "Select the relevant month at the top of the screen.",
          },
          {
            title: "Check the “Compras del mes” box",
            body: "If a warning mentions receptions without an NCF, find the corresponding supplier invoices: those lines will go out with an empty NCF in the 606 file.",
          },
          {
            title: "Download the 606 (purchases)",
            body: "One line per reception: supplier, RNC, NCF, invoice date, taxable base and ITBIS separated. Products received together are grouped on the same line.",
          },
          {
            title: "Download the 607 (sales)",
            body: "The journal of the month's collected sales, with the date, reference, channel, customer and amount. It is a draft: the NCF column is empty.",
          },
          {
            title: "Hand them to the accountant",
            body: "Send both files, making clear that the 607 is an internal journal without fiscal receipts: it is up to the accountant to decide how to file it.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Añadir (record an expense)",
        where: "Block 02 “Gastos operativos”, form at the top of the “Registrar y revisar gastos” panel",
        does: "Records an expense (amount, category, date, description) in the accounting.",
        effects: [
          "The expense is written permanently to the database, with your identity as the author.",
          "It counts in the month of the chosen date (not necessarily the displayed month): the list, the “Gastos del mes” total and that month's net result are recalculated right away.",
          "The “Gastos por categoría” breakdown is updated.",
          "The amount must be greater than zero; the description is limited to 200 characters; the “Mermas y pérdidas” category is not offered (it is reserved for losses declared from the Stock screen).",
        ],
        severity: "caution",
        undo: "Delete the line with the trash icon in the list just below.",
        audited: true,
        accountingImpact: "Adds an expense to the month of the chosen date: that month's net result goes down by the same amount.",
      },
      {
        label: "Trash icon (delete an expense)",
        where: "Block 02, to the right of each line in the expense list",
        does: "Permanently deletes the expense from the accounting, without asking for confirmation.",
        effects: [
          "The line is erased from the database immediately — there is no recycle bin.",
          "The expense total, the per-category breakdown and the month's net result are recalculated right away.",
          "If the deleted line is a “Mermas y pérdidas” (created automatically by a stock loss), the stock is NOT restored: the loss remains recorded on the inventory side, only the expense disappears from the accounting. The loss register keeps its trace, but the link to the expense is broken.",
        ],
        severity: "danger",
        undo: "Re-enter an identical expense (same amount, category and date). Exception: a “Mermas y pérdidas” line cannot be recreated by hand — only delete one in case of a proven error.",
        audited: true,
        accountingImpact: "Removes the expense from the month concerned: the net result goes back up by the same amount.",
      },
      {
        label: "606 · Compras (download)",
        where: "Below the 4 tiles, “Exportar DGII” row",
        does: "Downloads the purchase register for the displayed month, as a CSV file (readable in Excel).",
        effects: [
          "Changes nothing: it is just a download, repeatable as often as you like.",
          "The file rebuilds the purchases from the stock receptions entered during the month: one line per reception (supplier, RNC, NCF, invoice date, taxable base, ITBIS, total).",
          "If the reception was marked “Prices include ITBIS”, the file separates the base and the tax (18%); otherwise the amount is treated as exempt (ITBIS at zero).",
          "Receptions without an NCF come out with an empty NCF cell — the screen warns you about it in the “Compras del mes” box.",
        ],
        severity: "safe",
      },
      {
        label: "607 · Ventas (borrador) (download)",
        where: "Below the 4 tiles, “Exportar DGII” row",
        does: "Downloads the journal of the displayed month's collected sales, as a CSV file — as a draft.",
        effects: [
          "Changes nothing: it is just a download, repeatable as often as you like.",
          "One line per collected sale: collection date, reference, channel (Mostrador / Web / Cuenta), customer name and total amount.",
          "The NCF column is empty on every line: the pharmacy does not issue fiscal receipts yet. This file is an internal journal, not a return ready to file.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Only COLLECTED sales count towards revenue (reservations marked “Collected” and counter sales). A pending or confirmed reservation does not count yet — and a sale counts in the month it was collected, not the month the reservation was created.",
      "An unknown cost is never counted as zero: a sale whose product has no recorded cost is simply excluded from the cost of sales and the margin. The “Cobertura de coste” gauge shows the share of revenue whose cost is known — as long as it is below 100%, the net result is more optimistic than reality.",
      "The “Mermas y pérdidas” category fills itself in when you declare a loss (expired, damaged or stolen product) in the Stock screen. It does not appear in the entry form: it cannot be created by hand.",
      "Deleting a “Mermas y pérdidas” line does not put the product back in stock: the loss remains recorded on the inventory side, only the accounting expense disappears. Only do it in case of a genuine error.",
      "A stock reception counts in the month it was entered in the Stock screen, not the month of the supplier's invoice (the invoice date still appears in the 606 file).",
      "A recorded reception can no longer be edited: supplier, RNC, NCF and invoice date are frozen at entry. Check them when recording the reception in the Stock screen — a reception without an NCF will forever come out with an empty cell in the 606.",
      "The 607 is a draft: empty NCF on every line. Do not file it as-is with the DGII — hand it to the accountant.",
      "Apart from the expenses, nothing on this screen can be edited: to fix a figure, act at the source (Stock screen for receptions and losses, Sales screen for collections).",
      "This screen is displayed in Spanish regardless of the language chosen for the admin panel.",
    ],
  },
]
