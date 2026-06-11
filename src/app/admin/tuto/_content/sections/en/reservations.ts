import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "reservations",
    navLabel: "Reservations",
    title: "Reservations — the inbox for customer requests",
    route: "/admin/reservations",
    intro:
      "This screen gathers every reservation in progress: those placed on the website (by a customer with an account or a visitor), and those you create yourself for a customer on the phone or at the counter. This is where you contact the customer on WhatsApp, confirm their visit, then mark the reservation “Collected” when they come in to pay and pick up their products. Collected reservations leave this screen and move to the Sales screen. Important: reserving does NOT block stock — units only leave stock at the moment of pickup at the pharmacy. A web reservation is kept for 24 hours, a manual one for 30 days; past that deadline without confirmation, it expires on its own.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 7, kind: "text", label: "Admin › Operations › Reservations" },
            { w: 2, kind: "button", label: "Export CSV" },
            { w: 3, kind: "button", label: "+ New manual", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Search by reference, client, phone…", hotspot: 2 },
            { w: 4, kind: "tabs", label: "All · Reserved · Confirmed · Cancelled · Expired", hotspot: 3 },
            { w: 3, kind: "input", label: "Sort by" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "X selected · WhatsApp reminder · Mark · Cancel", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Reference · Client · Items · Total · Status · Date", hotspot: 5 },
            { w: 3, kind: "panel", label: "3 action icons per row", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Pagination (25 per page)" },
            { w: 8, kind: "drawer", label: "Detail drawer: client · products · total · note · actions", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "New manual",
        desc: "Opens the creation drawer for a reservation for a customer who calls or shows up at the counter: customer identity, products, internal note.",
      },
      {
        n: 2,
        label: "Search",
        desc: "Filters the list by reference (FAR-…), customer name, phone or email. It only searches the reservations of the current tab.",
      },
      {
        n: 3,
        label: "Status tabs",
        desc: "Each tab shows its counter. “Reserved” = to contact, “Confirmed” = customer notified, plus “Cancelled” and “Expired”. “All” groups everything EXCEPT collected sales, which live in the Sales screen.",
      },
      {
        n: 4,
        label: "Batch actions bar",
        desc: "Appears as soon as at least one row is ticked: grouped WhatsApp reminder, grouped status advance (only if all ticked rows share the same status, “Reserved” or “Confirmed”) and grouped cancellation.",
      },
      {
        n: 5,
        label: "The table",
        desc: "One row per reservation: checkbox, reference, customer (name, phone, origin badge Counter or Anonymous web), number of items, total in pesos, status badge and date. Clicking the row opens the detail drawer.",
      },
      {
        n: 6,
        label: "The row actions",
        desc: "From left to right: open WhatsApp with the pre-written message (only if the customer has a phone number), the check mark to move to the next status (“Mark confirmed” then “Mark collected”), and “…” to open the detail.",
      },
      {
        n: 7,
        label: "The detail drawer",
        desc: "Opens on the right: customer details (clickable phone and email), list of products with their price (pencil to adjust a price as long as the reservation is not collected), total, internal note with automatic saving, then the WhatsApp button, the next-status button and the “Cancel reservation” link.",
      },
    ],
    workflows: [
      {
        title: "Handle a reservation received from the website",
        steps: [
          {
            title: "Open the “Reserved” tab",
            body: "This is the queue: the “not contacted” counter at the top of the page tells you how many requests are waiting. Click a row to open the detail.",
          },
          {
            title: "Check the products on the shelf",
            body: "The reservation does not block stock: make sure the requested products are actually available before promising anything to the customer.",
          },
          {
            title: "Contact the customer on WhatsApp",
            body: "Click the green button: WhatsApp opens with a message already written — reference, list of products and total. Agree on a pickup time.",
          },
          {
            title: "Mark the reservation “Confirmed”",
            body: "Once the customer agrees, click “Mark confirmed”. The reservation will no longer expire automatically: it is your commitment to keep it.",
          },
          {
            title: "When they come in, mark “Collected”",
            body: "The customer pays and leaves with their products: click “Mark collected”. Stock is decremented, the sale enters the month's accounting and the row moves to the Sales screen.",
          },
        ],
      },
      {
        title: "Create a reservation for a customer on the phone",
        steps: [
          {
            title: "Click “New manual”",
            body: "The creation drawer opens. A manual reservation is kept for 30 days (instead of 24 hours for the website) — you manage it actively.",
          },
          {
            title: "Identify the customer",
            body: "Three ways: find their existing account, create an express account for them (first name + phone), or enter them as a guest with at least a phone number. If you link them to an account that already has an active reservation, the creation will be refused.",
          },
          {
            title: "Add the products",
            body: "Type at least two letters in the search and click the product: it is added with its current price. You can change the price and quantity of each line, or add a “Free line” for a product outside the catalogue.",
          },
          {
            title: "Validate with “Create reservation”",
            body: "It appears in the “Reserved” tab with the “Counter” origin badge. No email is sent for a manual creation — notify the customer yourself.",
          },
        ],
      },
      {
        title: "Grant a preferential price",
        steps: [
          {
            title: "Open the reservation detail",
            body: "Price adjustment is only possible on a “Reserved” or “Confirmed” reservation — never after collection.",
          },
          {
            title: "Click the pencil on the product line",
            body: "In the Products section of the drawer, each line carries a small pencil. An input field replaces the amount.",
          },
          {
            title: "Enter the new unit price and validate",
            body: "Click the check mark (or press Enter). The reservation total is recalculated immediately and the change is recorded in the audit log with the old and new price.",
          },
          {
            title: "Check the new total",
            body: "That is the price that will be charged and recorded in accounting at collection — the price shown on the website does not change.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "“Mark confirmed” (row, drawer or batch “Mark confirmed”)",
        where: "Check mark of a “Reserved” row, black button in the drawer, or batch actions bar",
        does: "Moves the reservation from “Reserved” to “Confirmed”: you have come to an agreement with the customer.",
        effects: [
          "The status badge changes to “Confirmed” and the confirmation date is recorded in the database.",
          "The reservation NO longer expires automatically: the countdown (24 h for the website, 30 days for a manual one) only applies to “Reserved” reservations.",
          "Stock does not move — it will only be decremented at collection.",
          "No button allows going back to “Reserved”: the only way out afterwards is “Collected” or cancellation.",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "A customer with an account sees the “Confirmed” status in their account, on the “Purchase history” page (“Purchases” tab).",
      },
      {
        label: "“Mark collected” (row, drawer or batch “Mark collected”)",
        where: "Check mark of a “Confirmed” row, black button in the drawer, or batch actions bar",
        does: "Records that the customer came in to pay and leave with their products: the reservation becomes a sale.",
        effects: [
          "Each product's stock is decremented by the reserved quantity (never below 0; free lines and unlimited-stock products are ignored).",
          "The average purchase cost at that moment is frozen on each line to calculate this sale's margin — it will never change, even if the product's cost evolves later.",
          "The sale enters the month's revenue (Accounting screen) at the billed price of each line.",
          "The row leaves this screen and moves to the Sales screen (journal of collected sales).",
          "The reservation's prices become locked: no further adjustment is possible.",
        ],
        severity: "caution",
        undo: "From the Sales screen: cancelling the sale automatically re-credits stock and removes it from revenue.",
        audited: true,
        publicImpact: "The displayed availability of products drops on the website; a customer with an account sees “Collected” in their purchase history.",
        accountingImpact: "Adds the sale to the month's revenue and freezes the cost that will be used to calculate the margin.",
      },
      {
        label: "“Cancel reservation” (drawer) / “Cancel” (batch)",
        where: "Underlined link at the bottom of the detail drawer, or batch actions bar",
        does: "Permanently cancels the reservation, after a confirmation dialog.",
        effects: [
          "The status changes to “Cancelled” — the row stays visible in the “Cancelled” tab, nothing is erased.",
          "Stock is not touched: it had never been decremented (the reservation was not collected).",
          "It is final: no button allows reactivating a cancelled reservation. If it needs to be picked up again, create a new one via “New manual”.",
          "In batch, each ticked reservation is cancelled one after the other, after a single confirmation.",
          "The customer is NOT notified automatically — contact them on WhatsApp if needed.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "A customer with an account sees “Cancelled” in their space, and can place a new reservation on the website.",
      },
      {
        label: "“Adjust price” pencil on a product line",
        where: "Detail drawer, Products section — visible only if the reservation is “Reserved” or “Confirmed”",
        does: "Changes the billed unit price of a product on THIS reservation (preferential price for a loyal customer).",
        effects: [
          "The line's price is replaced (rounded to the cent) and the reservation total is recalculated right away — line and total can never contradict each other.",
          "Refused if the reservation is already collected, expired or cancelled: “Price locked” message.",
          "The change is recorded in the audit log as a high-impact operation, with the old and new price.",
          "Does NOT change the product page price or other reservations: only this customer, on this reservation, is affected.",
          "This adjusted price is the one that will be charged and recorded in accounting at collection.",
        ],
        severity: "caution",
        undo: "As long as the reservation is not collected, re-enter the old price the same way.",
        audited: true,
        publicImpact: "A customer with an account sees the new total of their reservation in their space; the price shown in the store does not change.",
        accountingImpact: "The billed price enters revenue as-is at collection.",
      },
      {
        label: "Internal note (drawer text area)",
        where: "Detail drawer, “Internal note · FARMAU team only” section",
        does: "Keeps an instruction for the team (e.g. “The customer prefers to pay cash”).",
        effects: [
          "Saving is automatic: about one second after your last keystroke, the “Saved” mention appears.",
          "The note is never visible to the customer — not on the website, nor in WhatsApp messages or emails.",
        ],
        severity: "safe",
        undo: "Edit or erase the text: it re-saves on its own.",
        audited: true,
      },
      {
        label: "“New manual” → “Create reservation”",
        where: "Button at the top right of the screen, then button at the bottom of the creation drawer",
        does: "Creates a reservation for a customer who calls or shows up at the counter, without going through the website.",
        effects: [
          "The reservation is born with the “Reserved” status, the “Counter” origin badge, and is kept for 30 days before automatic expiry.",
          "The prices entered in the drawer are frozen as-is on the reservation (you can change them line by line before validating).",
          "Stock is not touched at creation — it will only drop at collection.",
          "If you link the reservation to a customer account that already has an active reservation, the creation is refused: “This customer already has an active reservation.”",
          "No confirmation email is sent for a manual creation (unlike reservations placed on the website).",
          "The button stays greyed out as long as there is not at least one product and a valid customer identity (a guest requires at least a phone number).",
        ],
        severity: "caution",
        undo: "Cancel the created reservation: it will remain listed under “Cancelled”.",
        audited: true,
      },
      {
        label: "“Open WhatsApp” / “WhatsApp reminder” (batch)",
        where: "Green button on a row, in the drawer, or in the batch actions bar",
        does: "Opens WhatsApp to the customer with a message already written: reference, list of products and total.",
        effects: [
          "Records nothing: neither the status nor the reservation changes — it is up to you to send the message then mark “Confirmed”.",
          "The button only appears if the reservation has a phone number.",
          "In batch, a WhatsApp tab opens for EACH ticked reservation that has a phone number — the browser may block these windows: allow them if nothing opens.",
        ],
        severity: "safe",
      },
    ],
    flows: [
      {
        title: "The life cycle of a reservation",
        lanes: [
          [
            {
              label: "Reserved",
              tone: "neutral",
              note: "The request arrives (website or manual). Stock is not blocked. If it comes from the website and the customer left an email, they receive a summary with a WhatsApp button.",
            },
            {
              label: "Confirmed",
              tone: "neutral",
              note: "You agreed on the visit with the customer. The reservation no longer expires automatically.",
            },
            {
              label: "Collected",
              tone: "ok",
              note: "The customer paid and took their products: stock decremented, cost frozen for the margin, sale recorded. The row moves to the Sales screen.",
            },
          ],
          [
            {
              label: "Reserved",
              tone: "neutral",
              note: "Without confirmation in time (24 h for the website, 30 days for a manual one)…",
            },
            {
              label: "Expired",
              tone: "bad",
              note: "Automatic transition, checked every 15 minutes. Stock never moved. Final — the customer can reserve again.",
            },
          ],
          [
            {
              label: "Reserved or Confirmed",
              tone: "neutral",
              note: "The customer backs out, or you give up…",
            },
            {
              label: "Cancelled",
              tone: "bad",
              note: "Manual cancellation, final. Stock is intact (it only drops at collection).",
            },
          ],
          [
            {
              label: "Collected",
              tone: "ok",
              note: "Sale already recorded, visible in the Sales screen.",
            },
            {
              label: "Cancelled (from the Sales screen)",
              tone: "warn",
              note: "Stock is automatically re-credited and the sale leaves the month's revenue.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Reserving does not block stock: it only drops at the moment of collection. The last unit of a product can therefore be promised to two customers — check the shelf before confirming.",
      "Only “Reserved” reservations expire automatically (24 h for the website, 30 days for a manual one, checked every 15 minutes). A “Confirmed” reservation never disappears on its own: it is up to you to collect it or cancel it.",
      "“Cancelled” and “Expired” are final states: no button allows reactivating. If the request needs to be picked up again, recreate a reservation via “New manual”.",
      "The confirmation email to the customer only concerns reservations placed on the WEBSITE with a known email address, and only if the email-sending key is configured — otherwise nothing is sent, with no error message. A manual creation never sends an email: notify the customer yourself.",
      "The price adjusted with the pencil only applies to that reservation: the product page and other reservations keep their price. After collection, prices are locked (“Price locked” message).",
      "The “All” tab does not include collected sales: they live in the Sales screen. Only the “total” counter at the top of the page counts the whole base, collected sales included.",
      "The search only looks in the current tab: to search everywhere, first switch to “All”.",
      "The “Export CSV” button is not active yet — it shows “CSV export coming soon”.",
      "The batch “WhatsApp reminder” opens one tab per customer: if nothing opens, the browser is probably blocking pop-up windows.",
      "Batch actions advance statuses one reservation at a time: on a large selection, let the screen finish before clicking elsewhere. The grouped advance button only appears if all ticked rows share the same status, and only for “Reserved” or “Confirmed” ones.",
      "Cancelling a reservation does not notify the customer: remember to write to them on WhatsApp.",
      "The internal note is never visible to the customer, but every reservation change (status, note, price, creation) is recorded in the audit log with your name.",
    ],
  },
]
