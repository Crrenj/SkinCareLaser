import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "concepts",
    navLabel: "Key concepts",
    title: "The key concepts — to understand before everything else",
    route: "",
    intro:
      "Before opening the screens one by one, take five minutes to follow three threads: the journey of an order (from the reservation on the site to the payment at the counter), the life of a price (from the placeholder price to the amount actually charged) and the life of a cost (from the supplier invoice to the margin in accounting). Almost the whole admin panel makes sense once you know these three stories. Below, you will find the general rules that apply everywhere, and the most frequent mix-ups to avoid.",
    flows: [
      {
        title: "From reservation to sale",
        lanes: [
          [
            {
              label: "The customer reserves on the site",
              note: "From their cart, the customer clicks “Reserve”. They get a reference (FAR-…). Important: stock does not move at this point.",
            },
            {
              label: "Reserved — in your inbox",
              tone: "warn",
              note: "The request appears in the Reservations screen, “Reserved” tab. It is waiting for your contact. Without confirmation, it will expire on its own after 24 hours.",
            },
            {
              label: "Confirmed — customer notified",
              note: "You contact the customer (WhatsApp button with a pre-filled message: reference and product list), then mark the reservation “Confirmed”.",
            },
            {
              label: "Collected — paid and picked up",
              tone: "ok",
              note: "The customer comes to the pharmacy, you take the payment and mark “Collected”. This is the moment when stock goes down, the cost is frozen and the sale enters accounting. The line leaves Reservations and joins the Sales screen.",
            },
          ],
          [
            {
              label: "Direct counter sale",
              note: "For a customer buying on the spot without a reservation: Sales screen → “Counter sale”. Customer with an account (existing or created on the spot) or anonymous, your choice.",
            },
            {
              label: "Immediate collection",
              tone: "ok",
              note: "The sale is recorded directly as “Collected”: stock decremented right away, sale in accounting right away. No confirmation step.",
            },
          ],
          [
            {
              label: "No news from the customer…",
              tone: "warn",
              note: "Web reservation: 24 hours. Reservation created by you (phone, counter): 30 days.",
            },
            {
              label: "Expired",
              tone: "bad",
              note: "The switch to “Expired” is automatic (a check runs every 15 minutes). The customer is not notified. Since stock never moved, there is nothing to put back on the shelf.",
            },
          ],
        ],
      },
      {
        title: "The life of a price",
        lanes: [
          [
            {
              label: "Placeholder price: 100 pesos",
              tone: "warn",
              note: "All products imported at the start carry a placeholder price of 100 pesos. Until it is replaced, THIS is the price displayed and the price that would be charged.",
            },
            {
              label: "Real selling price",
              note: "Entered on the product sheet (Products screen) or via the “Initialize this product” action in the Stock screen.",
            },
            {
              label: "Possible promotion",
              note: "A promotion campaign (Promotions screen) shows the crossed-out price and the discount on the site. If several promotions target the same product, the one most favorable to the customer applies.",
            },
            {
              label: "Frozen in the reservation",
              note: "The moment the customer reserves, the day's price (promotion included) is copied into the reservation. A promotion created or deleted afterwards changes nothing for reservations already placed.",
            },
            {
              label: "Adjustable before payment",
              tone: "warn",
              note: "In the detail of a “Reserved” or “Confirmed” reservation, you can correct the price of a line (commercial gesture, loyal customer). The total is recalculated and the change is recorded in the audit log. This is why the public product page carries the note “Indicative price — confirmed in pharmacy”.",
            },
            {
              label: "Locked at collection",
              tone: "ok",
              note: "As soon as the reservation is marked “Collected”, no price change is possible anymore: this is the amount that counts in accounting.",
            },
          ],
        ],
      },
      {
        title: "The life of a cost",
        lanes: [
          [
            {
              label: "Reception with cost",
              note: "At each supplier delivery, you record a “Stock entry” in the Stock screen: quantities received AND unit cost paid (optionally with the supplier invoice details for tax declarations).",
            },
            {
              label: "Weighted average cost",
              note: "The product keeps an average cost, recalculated automatically at each reception (old stock and new stock blended, in proportion to the quantities).",
            },
            {
              label: "Frozen at the sale",
              note: "At collection time, the day's average cost is copied once and for all into the sale. Later receptions no longer change that sale's margin.",
            },
            {
              label: "Margin in accounting",
              tone: "ok",
              note: "The Accounting screen computes: collected sales − cost of goods sold − expenses = result. Sales whose cost is unknown are flagged separately, never counted as “zero cost”.",
            },
          ],
          [
            {
              label: "Loss / expired product",
              tone: "warn",
              note: "Expired, damaged, stolen product or inventory discrepancy: use the loss action in the Stock screen (pick a reason: expired, damaged, theft, adjustment).",
            },
            {
              label: "Stock decreased + expense at cost",
              tone: "bad",
              note: "Stock goes down and a “merma” (loss) expense enters accounting, valued at the product's average cost (never at the selling price). If the cost is unknown, stock still goes down but no expense is created.",
            },
          ],
        ],
      },
    ],
    actions: [
      {
        label: "One account = two hats",
        where: "The whole panel",
        does:
          "Being an admin is not a separate account: it is your usual customer account, with the admin hat added on top. You keep your personal cart, reservations, favorites and profile.",
        effects: [
          "At the bottom of the admin menu: “View site” opens the shop, “My account” opens your personal customer space.",
          "From your customer space, an “Admin panel” link brings you back here.",
          "To give a colleague access to the panel, you promote their existing customer account (Users screen) — no special account is created.",
          "Removing someone's admin hat does not delete their customer account: they simply become a normal customer again.",
        ],
        severity: "safe",
      },
      {
        label: "The panel language is independent from the public site",
        where: "Header of every admin page (FR / ES / EN buttons)",
        does:
          "You can work in the panel in French, Spanish or English. This choice only affects YOUR admin screen.",
        effects: [
          "The public site keeps its three languages, chosen by each visitor — your admin setting changes nothing there.",
          "Each of your fellow admins has their own working language.",
          "The choice is remembered in your browser for about a year.",
        ],
        severity: "safe",
      },
      {
        label: "Stock NEVER goes down at reservation",
        where: "Reservations, Sales, Stock",
        does:
          "Reserving sets nothing aside in the database. Stock is only deducted when you mark the reservation “Collected” (or during a counter sale, collected immediately).",
        effects: [
          "Two customers can reserve the same last unit: check the shelf before confirming.",
          "A reservation that expires or is cancelled before collection has no effect on stock — nothing to put back on the shelf.",
          "If you void a sale already “Collected”, the stock is automatically credited back.",
          "The stock shown on the site never drops below zero, even if the system count was wrong.",
        ],
        severity: "caution",
        accountingImpact: "The sale only enters accounting (revenue, cost, margin) at collection time.",
      },
      {
        label: "Important actions are recorded in the audit log",
        where: "Access › Activity log",
        does:
          "Almost every creation, change or deletion made in the panel (products, prices, stock, reservations, promotions, settings…) is recorded automatically: who, what, when, and which fields were changed (with their new values).",
        effects: [
          "All admins can read the log — useful to understand “who changed this price”.",
          "Sensitive changes (a reservation price, for example) are flagged “high impact”.",
          "Simply viewing screens is not recorded: only what changes data is.",
        ],
        severity: "safe",
      },
      {
        label: "Reservations expire on their own",
        where: "Reservations",
        does:
          "An unconfirmed web reservation automatically switches to “Expired” after 24 hours (30 days for a reservation you create yourself). A check runs every 15 minutes, with no action needed from you.",
        effects: [
          "The customer is not notified of the expiry: if you want to follow up, do it before the deadline.",
          "A “Confirmed” reservation no longer expires: confirming protects the request.",
          "Since stock never moved, an expiry requires no tidying up.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Reception ≠ adjustment. The “Stock entry” (supplier delivery, with cost) feeds the average cost and the purchase ledger. “Adjust inventory” only corrects the number of units, without touching the cost: if you record a delivery as an adjustment, the average cost becomes wrong and so does the margin.",
      "The price shown on the site can differ from the price charged: you can adjust the price of a reservation line before collection. This is by design — the public product page states “Indicative price — confirmed in pharmacy”.",
      "Deleting ≠ deactivating. Deactivating a product removes it from the site but keeps everything (photos, history, stock): it is reversible. Deleting is final: photos and the reception and loss history disappear with it. Only past sales survive (they keep a copy of the name and price). When in doubt, deactivate.",
      "A promotion created after the fact does not change reservations already placed: their price was frozen at reservation time.",
      "The catalogue arrived with a placeholder price of 100 pesos on every product. Until the real price is entered, this is the amount displayed and the amount that would be charged — hence the “Initialize this product” action in the Stock screen.",
      "Cancelling a reservation that was never collected has no consequences (no stock, no accounting). Voiding a sale already collected credits the stock back and removes the sale from the sales journal: keep it for genuine till mistakes.",
    ],
  },
]
