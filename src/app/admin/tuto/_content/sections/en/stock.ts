import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "stock",
    navLabel: "Stock",
    title: "Stock — inventory, entries, losses and average cost",
    route: "/admin/stock",
    intro:
      "This screen tracks the on-shelf quantities of every product and carries the pharmacy's four inventory operations: receiving a supplier delivery, adjusting a count, declaring a loss (expired, damaged or stolen product) and initializing a product for launch. It also shows each product's purchase cost and margin. The cost used everywhere is the weighted average cost: if you have 10 units bought at 80 pesos and you receive 10 more at 100 pesos, the average cost becomes 90 pesos per unit. This average cost is used to compute margins, the inventory value and the amount of losses — and it is ONLY updated by stock entries. Hence the screen's golden rule: a delivery ALWAYS goes through a stock entry (which adds the units and records the cost), never through an adjustment (which overwrites the figure without telling accounting anything).",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Catalogue › Stock" },
            { w: 4, kind: "button", label: "+ Stock entry", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "toolbar", label: "Search a product…", hotspot: 2 },
            { w: 5, kind: "tabs", label: "All · Normal · Low · Out", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Total products", hotspot: 4 },
            { w: 3, kind: "kpi", label: "Normal stock" },
            { w: 3, kind: "kpi", label: "Low stock" },
            { w: 3, kind: "kpi", label: "Out of stock" },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Product · Stock · Cost · Margin · Status · Updated", hotspot: 5 },
            { w: 3, kind: "panel", label: "4 action icons per row", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Dimmed background" },
            { w: 8, kind: "drawer", label: "Drawers: Entry · Initialization · Loss + Adjustment dialog", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Stock entry",
        desc: "Opens the goods-receipt drawer, empty. You add the delivered products one by one. The “+” on a table row opens the same drawer with the product already pre-filled.",
      },
      {
        n: 2,
        label: "Search",
        desc: "Filters the list on the product name. Type words with their exact accents: “creme” will not find “crème”.",
      },
      {
        n: 3,
        label: "Status tabs",
        desc: "Filter the list by stock state: All, Normal, Low, Out — each tab shows its counter. The Out tab turns red when selected.",
      },
      {
        n: 4,
        label: "The 4 status tiles",
        desc: "The numbers at a glance: total number of products, with normal stock (above the low-stock threshold), low stock (at or below the threshold, excluding out of stock) and out of stock (0 units). The threshold is set in Shop & reservations → Inventory (default 10).",
      },
      {
        n: 5,
        label: "The table",
        desc: "One row per product: name and brand, stock in units, average purchase cost, margin (the share of the selling price left after the cost — red if the product sells at a loss), status pill and last-updated date. A dash “—” in Cost or Margin means no entry has recorded a cost yet. Low-stock rows are shaded yellow, out-of-stock rows red. You can sort by Product and Stock; the Status and Updated headers are also clickable, but they actually re-sort the list by product name.",
      },
      {
        n: 6,
        label: "The 4 row actions",
        desc: "From left to right: “Initialize this product” (clipboard — the launch drawer), “Stock entry” (+ — pre-filled receipt), “Adjust inventory” (pencil — fix the figure), “Record loss” (package with a minus — expired, damaged, theft).",
      },
      {
        n: 7,
        label: "Operation drawers and dialog",
        desc: "Each operation opens on top of the screen: three drawers on the right (entry, initialization, loss) and a small central dialog for the adjustment. Nothing is saved until you click the confirm button at the bottom.",
      },
    ],
    workflows: [
      {
        title: "Receive a supplier delivery",
        steps: [
          {
            title: "Open the entry drawer",
            body: "Click “Stock entry” at the top right. One entry matches ONE supplier invoice — if you have two invoices, record two entries.",
          },
          {
            title: "Add the delivered products",
            body: "Type at least two letters in the drawer's search and click the product in the list. Clicking the same product again increases its quantity by one unit.",
          },
          {
            title: "Enter quantity and cost per line",
            body: "The cost is the price paid to the supplier PER UNIT — not the selling price. Each line needs a quantity of at least 1 and a cost above 0, otherwise the confirm button stays greyed out.",
          },
          {
            title: "Fill in the invoice (recommended)",
            body: "Expand “Purchase details (606)”: supplier, RNC, NCF, invoice date. The “Prices include ITBIS” box is checked by default. This information feeds the purchase register filed with the tax authority.",
          },
          {
            title: "Check then confirm",
            body: "The total cost and the unit count show at the bottom. Re-read the figures carefully: once recorded, the entry can no longer be deleted from the panel. Click “Record entry”.",
          },
        ],
      },
      {
        title: "Declare expired or damaged products (loss)",
        steps: [
          {
            title: "Find the product's row",
            body: "Use the search or the tabs, then click the package-with-a-minus icon: the “Record loss / expired product” drawer opens.",
          },
          {
            title: "Enter quantity and reason",
            body: "Pick the reason (Expired, Damaged, Theft / loss, Inventory adjustment) and add an internal note if useful, for example the batch number.",
          },
          {
            title: "Check the “Loss cost”",
            body: "The drawer shows the amount that will go to expenses: average cost × quantity. If it says “Unknown cost”, the stock will drop but NO expense will reach accounting.",
          },
          {
            title: "Confirm",
            body: "Click “Record loss”: the units leave the stock and the expense automatically appears in the Accounting screen, dated today.",
          },
        ],
      },
      {
        title: "Initialize a product for launch",
        steps: [
          {
            title: "Open the initialization drawer",
            body: "Click the clipboard icon on the product's row. The drawer recalls its current stock and price — a “placeholder” badge flags the provisional 100-peso price inherited from the catalogue import.",
          },
          {
            title: "Count the units on the shelf",
            body: "Enter the quantity actually counted. Careful: the form accepts 0 — if you confirm with 0 and no cost, the product's stock will be set to 0.",
          },
          {
            title: "Add the purchase cost if you have it",
            body: "Invoice at hand? Enter the cost per unit: the operation will be treated as a stock entry and the margin will be known from the first sale. Otherwise, leave it empty: the stock will simply be set to the counted figure.",
          },
          {
            title: "Set the real selling price",
            body: "If the current price is the provisional one, enter the real price: it will replace the price shown on the site (visible within about a minute).",
          },
          {
            title: "Decide on going live, then confirm",
            body: "The “Activate product” box is checked by default — untick it if the product is not ready to be sold. The bottom panel sums up the mode used (entry or adjustment) and the final stock before you click “Initialize”.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "“Stock entry” → “Record entry” (goods receipt)",
        where: "Button at the top right of the screen, or “+” icon on a row (pre-filled product), then button at the bottom of the drawer",
        does: "Records the arrival of a supplier delivery: the units are ADDED to the stock and the purchase cost is saved.",
        effects: [
          "Each line (product, quantity, cost paid per unit) is added to the existing stock — nothing is overwritten.",
          "The product's weighted average cost is recalculated: the old stock at the old cost and the received units at the new cost are averaged together. If there was no cost yet (or no stock left), the delivery's cost becomes the average cost.",
          "Each line is permanently written to the purchase history, which feeds the 606 register filed with the tax authority — with supplier, RNC, NCF and invoice date if you filled in the “Purchase details (606)” section. One entry = one invoice.",
          "With the “Prices include ITBIS” box checked (default), accounting can split the tax from the price paid in the purchase export; untick it for an exempt product.",
          "The button stays greyed out until every line has a quantity of at least 1 AND a cost above 0 (a cost of 0 would skew the average cost).",
          "Once confirmed, the entry can no longer be deleted or edited from the panel: the stock figure can be fixed afterwards with an adjustment, but the recalculated average cost and the purchase-register line remain.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "The displayed availability of products (in stock / low stock / out of stock) reaches the site within about a minute.",
        accountingImpact: "Feeds the month's purchase register (606) and the inventory value; sets the average cost used to compute margins.",
      },
      {
        label: "Pencil → “Save” (adjust inventory)",
        where: "Pencil icon on a table row, then the “Adjust inventory” dialog",
        does: "Replaces the stock figure with the exact quantity you enter (count, error correction).",
        effects: [
          "The figure you enter OVERWRITES the old one: if the product showed 12 units and you type 8, it has 8 — not 20. It is the opposite of the stock entry, which adds.",
          "No cost is recorded and accounting sees nothing happen: no purchase in the 606 register, no expense, no average-cost recalculation.",
          "Use it only to make the figure match what is actually on the shelf. Never to record a delivery (accounting would stay blind to those units) nor to declare expired goods (use the loss, which creates the matching expense).",
        ],
        severity: "caution",
        undo: "Reopen the dialog and re-enter the old figure.",
        audited: true,
        publicImpact: "The product's displayed availability changes on the site within about a minute; at 0, customers can no longer reserve it.",
      },
      {
        label: "“Record loss” (shrinkage: expired, damaged, stolen)",
        where: "Package-with-a-minus icon on a row, then the “Record loss / expired product” drawer",
        does: "Takes units out of the stock AND automatically records the loss as an expense in accounting, at the average cost.",
        effects: [
          "The product's stock drops by the entered quantity (never below 0).",
          "If the product's average cost is known, a “Mermas y pérdidas” expense is automatically created in accounting, dated today: average cost × quantity. The drawer shows this amount before you confirm.",
          "If the cost is unknown (no entry has ever recorded a cost), the stock still drops but NO expense is created — the month's result will not see this loss.",
          "The loss is logged in an internal loss register, with the cost frozen at that moment, the chosen reason (Expired, Damaged, Theft / loss, Inventory adjustment) and your note.",
          "It touches neither the average cost nor the purchase register: it is an outflow, not a purchase.",
          "Careful: the expense is computed on the entered quantity, even if it exceeds the displayed stock — the stock stops at 0, but the expense counts every declared unit.",
        ],
        severity: "caution",
        undo: "Partially: raise the stock back via “Adjust inventory” and delete the matching expense in the Accounting screen (trash icon in the expense list). The internal loss-register line, however, remains.",
        audited: true,
        publicImpact: "The product's displayed availability drops on the site; at 0, it goes out of stock and can no longer be reserved.",
        accountingImpact: "Creates a “Mermas y pérdidas” expense at the average cost in the month's result (unless the cost is unknown: no expense).",
      },
      {
        label: "“Initialize this product” → “Initialize”",
        where: "Clipboard icon on a row, then the “Initialize product” drawer",
        does: "Gets a product ready for launch in one go: counted stock, optional purchase cost, selling price, and going live.",
        effects: [
          "No field is mandatory: the “Initialize” button lights up as soon as there is at least one useful action (counted quantity, entered price or “Activate product” box checked). The purchase cost, the selling price and the activation are optional.",
          "WITH a purchase cost: the operation is treated as a STOCK ENTRY — the quantity is ADDED to the current stock, the average cost is recorded (margin known from the first sale) and a line enters the purchase history (without a supplier invoice).",
          "WITHOUT a cost: the operation is treated as an ADJUSTMENT — the stock is SET to the counted quantity (including 0), with nothing for accounting; the margin will only be known at the first restock. The bottom panel shows the mode used and the resulting stock BEFORE you confirm.",
          "Special case: cost filled in but quantity 0 — the stock does not move.",
          "Selling price: replaces the price shown on the site (reflected within about a minute). The field is pre-filled with the current price, unless it is the provisional 100-peso price (flagged with a “placeholder” badge).",
          "“Activate product” box (checked by default): makes the product visible and reservable on the public site. The eye icon on the Products screen then lets you hide it again (and republish) at any time.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "Can change the displayed price and put the product online on the public site (visible within about a minute).",
        accountingImpact: "If a cost is entered, the operation enters the purchase history (606) and sets the product's average cost.",
      },
    ],
    flows: [
      {
        title: "Stock state as displayed (tiles, tabs, pills)",
        lanes: [
          [
            {
              label: "Normal",
              tone: "ok",
              note: "Above the low-stock threshold.",
            },
            {
              label: "Low stock",
              tone: "warn",
              note: "At or below the low-stock threshold — the row is shaded yellow. Think about restocking.",
            },
            {
              label: "Out of stock",
              tone: "bad",
              note: "0 units — customers can no longer reserve the product.",
            },
          ],
        ],
      },
      {
        title: "Units in and out",
        lanes: [
          [
            {
              label: "Stock entry",
              tone: "neutral",
              note: "Units are added, the average cost is recalculated, the purchase enters the 606 register.",
            },
            {
              label: "In stock",
              tone: "ok",
              note: "Visible and reservable on the public site.",
            },
            {
              label: "Sale collected",
              tone: "ok",
              note: "The stock drops at pickup time in the pharmacy; the cost at that moment is frozen on the sale to compute its margin.",
            },
          ],
          [
            {
              label: "In stock",
              tone: "neutral",
              note: "Product on the shelf.",
            },
            {
              label: "Loss declared",
              tone: "warn",
              note: "Expired, damaged, stolen: the units leave the stock immediately.",
            },
            {
              label: "Expense in accounting",
              tone: "bad",
              note: "“Mermas y pérdidas” at average cost × quantity, dated today.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Entry ≠ adjustment — THE key distinction of this screen: the entry ADDS units and records a cost (accounting is fed); the adjustment OVERWRITES the figure and records nothing. Never record a delivery through the adjustment: those units would stay invisible to margins and the purchase register.",
      "A confirmed entry can no longer be deleted or corrected from the panel: re-read quantities and costs BEFORE clicking “Record entry”. If you make a mistake, only the stock figure can be caught up with an adjustment — the average cost and the purchase-register line remain.",
      "The adjustment never touches the average cost: if you correct large quantities by hand, the inventory value and the margins can drift from reality. Prefer entries for anything that is a real purchase.",
      "Loss: the expense is valued on the entered quantity, even beyond the displayed stock (the stock stops at 0, the expense counts everything). Check the quantity before confirming.",
      "Loss on a product with no known cost: the stock drops but no expense is created — the loss will not appear in the month's result. The drawer flags it with “Unknown cost”.",
      "In the initialization drawer, the “Activate product” box is CHECKED by default: untick it if the product is not ready. You can publish it (or hide it again) later with the eye icon on the Products screen.",
      "The stock figure does not move when a customer reserves: it only drops when the reservation is marked “Collected” in the pharmacy (Reservations screen).",
      "The cost entered at receipt is the price paid to the supplier PER UNIT, taxes included by default (“Prices include ITBIS” box) — not the selling price.",
      "The Cost and Margin columns are only visible in the admin panel, never on the public site. A red margin means the product sells for less than its purchase cost.",
      "The list search is accent-sensitive (“creme” will not find “crème”) and the “Low stock” threshold is set in Shop & reservations → Inventory (default 10, minimum 2).",
    ],
  },
]
