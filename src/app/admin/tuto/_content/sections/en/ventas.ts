import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "ventas",
    navLabel: "Sales",
    title: "Sales — the sales journal and counter sales",
    route: "/admin/ventas",
    intro:
      "This screen is the journal of everything that was actually sold and handed over to the customer, whatever the origin: a reservation placed on the site (with an account or as a guest) then picked up at the pharmacy, or a direct sale at the counter. At the top, four cards show today's revenue, this month's revenue, the number of sales this month and the average basket. This is also where you record a counter sale with the “Counter sale” button: the customer leaves immediately with the goods, stock drops on confirmation and the sale enters revenue right away. Each row carries its pickup date; counter sales and sales to a visitor without an account also carry an origin badge (“Counter”, “Anonymous (web)”) — a row without a badge belongs to a customer with an account.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Operations › Sales" },
            { w: 4, kind: "button", label: "+ Counter sale", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Revenue today", hotspot: 2 },
            { w: 3, kind: "kpi", label: "Revenue this month" },
            { w: 3, kind: "kpi", label: "Sales this month" },
            { w: 3, kind: "kpi", label: "Avg. basket" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Search a sale…", hotspot: 3 },
            { w: 4, kind: "tabs", label: "All · Counter · Account · Guest", hotspot: 4 },
            { w: 3, kind: "input", label: "Sort by" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "X selected · WhatsApp reminder · Cancel", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Reference · Client · Items · Total · Status · Date · Actions", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "text", label: "Pagination (25 per page)" },
            { w: 8, kind: "drawer", label: "Drawer: sale detail · note · void", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Counter sale",
        desc: "Opens the sale drawer: customer identity (existing account, express account creation, or anonymous), products, internal note, then “Record sale”.",
      },
      {
        n: 2,
        label: "Revenue cards",
        desc: "Today's revenue, this month's revenue, number of sales this month and average basket — computed on each sale's pickup date. A voided sale leaves them immediately.",
      },
      {
        n: 3,
        label: "Search",
        desc: "Filters the journal by reference (FAR-…), customer name, phone or email, within the current origin tab.",
      },
      {
        n: 4,
        label: "Origin tabs",
        desc: "Every row here is a collected sale: the tabs therefore filter by origin — Counter (recorded by you), Account (customer signed in on the site), Guest (site visitor without an account). Each tab shows its count.",
      },
      {
        n: 5,
        label: "Bulk actions bar",
        desc: "Appears as soon as at least one row is ticked: grouped WhatsApp reminder (one tab per customer with a phone number) and bulk voiding of the ticked sales.",
      },
      {
        n: 6,
        label: "The journal",
        desc: "One row per sale: reference, customer (name, phone, and a “Counter” or “Anonymous (web)” badge when the sale is not linked to an account), number of items, total in pesos, “Collected” status and the pickup date in the Date column. Clicking the row opens the detail drawer.",
      },
      {
        n: 7,
        label: "The detail drawer",
        desc: "Customer contact details, list of products with their prices (locked: the sale is already recorded), total, internal note with auto-save, WhatsApp button and the void link at the bottom.",
      },
    ],
    workflows: [
      {
        title: "Ring up a sale at the counter",
        steps: [
          {
            title: "Click “Counter sale”",
            body: "The sale drawer opens. By default the customer is “Anonymous”: perfect for a quick sale with no follow-up.",
          },
          {
            title: "Choose the customer identity (optional)",
            body: "Three paths: “Existing account” (find them by name or phone — the sale will enter their history), “Create account” (first name + phone, the customer finishes via WhatsApp), or “Anonymous”.",
          },
          {
            title: "Add the products",
            body: "Type at least two letters and click the product: it is added at the current price (promotions included). Adjust price and quantity line by line if needed, or add a “Free line” for an off-catalogue item.",
          },
          {
            title: "Confirm with “Record sale”",
            body: "The sale immediately counts as collected: stock drops right away, the cost is frozen for the margin, and the sale enters today's revenue. The button stays greyed out until there is at least one product.",
          },
        ],
      },
      {
        title: "Create an express account for a walk-in customer",
        steps: [
          {
            title: "In the sale drawer, choose “Create account”",
            body: "Enter the first name and phone (the last name is optional). That's all you need at the counter — no email or password to invent.",
          },
          {
            title: "Record the sale",
            body: "The account is created at confirmation time, then the sale is attached to it: it will appear in the customer's history on the site.",
          },
          {
            title: "Pass on the setup link",
            body: "An “Account created” window appears with two options: “Send via WhatsApp” (pre-written message with the link) or “Copy link”. This is the only chance to grab that link — do not close the window without passing it on.",
          },
          {
            title: "The customer finishes at home",
            body: "Opening the link signs them into their account, where they choose their password and real email address. They then find their purchase history and can reserve on the site.",
          },
        ],
      },
      {
        title: "Void a sale recorded by mistake",
        steps: [
          {
            title: "Find the sale",
            body: "Use the search (reference, name, phone) or the origin tabs, then click the row to open the detail drawer.",
          },
          {
            title: "Click the void link at the bottom of the drawer",
            body: "A confirmation dialog reminds you of the consequences: stock will be restored and the row will leave the journal.",
          },
          {
            title: "Confirm with “Void the sale”",
            body: "The products' stock is automatically credited back and the sale leaves revenue. The row remains viewable in the Reservations screen, “Cancelled” tab.",
          },
          {
            title: "Re-record if needed",
            body: "Voiding is final: if it was an input mistake (wrong price, wrong product), simply do a correct “Counter sale” again.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "“Counter sale” → “Record sale”",
        where: "Button at the top right of the screen, then button at the bottom of the sale drawer",
        does: "Records an immediate sale: the customer pays and leaves with the goods, everything is recorded on the spot.",
        effects: [
          "The sale is born directly with the “Collected” status, the “Counter” origin badge and the current pickup date — it appears in the journal right away.",
          "The stock of each catalogue product immediately drops by the quantity sold (never below 0; “free lines” and unlimited-stock products are untouched).",
          "The current average purchase cost is frozen on each line to compute this sale's margin — it will never change afterwards.",
          "The prices entered in the drawer are saved as-is and become final: no price adjustment is possible after confirmation.",
          "If you chose “Existing account” or “Create account”, the sale is attached to the customer's account and enters their history on the site.",
          "The button stays greyed out until there is at least one valid product; in sale mode, the “Anonymous” identity is enough.",
        ],
        severity: "caution",
        undo: "Void the sale from the journal: stock is credited back and it leaves revenue (the voided row remains visible in Reservations › Cancelled).",
        audited: true,
        publicImpact: "The displayed availability of the products drops on the site; if the sale is linked to an account, the customer sees it in their purchase history (the “Purchases” tab of their account).",
        accountingImpact: "Enters today's and this month's revenue immediately (top cards and the Accounting screen), with the margin computed on the frozen cost.",
      },
      {
        label: "“Create account” (Customer pane of the sale drawer)",
        where: "Sale drawer, Customer section — second tab, first name / last name / phone fields",
        does: "Creates a real customer account from just a first name and phone, the moment you confirm the sale.",
        effects: [
          "The account is created BEFORE the sale is recorded: if the sale then fails, the account still exists.",
          "A temporary internal email address and a random password are set automatically — the customer will replace them via the setup link.",
          "The customer's profile is filled with their first name, last name, phone and the current language.",
          "A setup link is generated and shown in the “Account created” window, to pass on to the customer (WhatsApp or copy).",
          "If the phone already matches an account, no duplicate is created: the sale is attached to the existing account and no link is generated.",
          "The customer's phone is not written to the audit log (personal data) — only the first and last name appear there.",
        ],
        severity: "caution",
        audited: true,
      },
      {
        label: "“Send via WhatsApp” / “Copy link” (“Account created” window)",
        where: "Window that appears right after recording a sale with account creation",
        does: "Gives the customer the link they will use to choose their password and email.",
        effects: [
          "“Send via WhatsApp” opens WhatsApp to the number entered, with a pre-written message containing the link; “Copy link” puts it on the clipboard.",
          "Nothing is saved to the database: actually sending the message is up to you.",
          "The link signs straight into the customer's account: share it with them only.",
          "Once the window is closed, the link cannot be retrieved anywhere in the admin panel — pass it on before closing.",
        ],
        severity: "safe",
      },
      {
        label: "“Cancel reservation” (drawer) / “Cancel” (bulk)",
        where: "Underlined link at the bottom of the detail drawer, or the bulk actions bar — the confirmation dialog is titled “Void sale”",
        does: "Permanently voids a collected sale (input mistake, immediate return).",
        effects: [
          "The status changes to “Cancelled”: the row leaves the sales journal and remains viewable in the Reservations screen, “Cancelled” tab.",
          "The stock of catalogue products is automatically credited back with the quantities sold (free lines are not affected).",
          "The sale leaves revenue: the top cards and the Accounting screen no longer count it.",
          "It is final: no button can re-record a voided sale — do a new “Counter sale” if needed.",
          "In bulk, each ticked sale is voided one after the other, after a single confirmation.",
          "The customer is NOT notified automatically.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "Product availability goes back up on the site; an account customer sees “Cancelled” in their account area.",
        accountingImpact: "Removes the sale from the month's revenue and margin.",
      },
      {
        label: "Internal note (drawer text area)",
        where: "Detail drawer, “Internal note · FARMAU team only” section",
        does: "Keeps an instruction for the team about this sale (e.g. “Paid cash, asks for an invoice”).",
        effects: [
          "Saving is automatic: about one second after your last keystroke, “Saved” appears.",
          "The note is never visible to the customer — neither on the site nor in WhatsApp messages.",
        ],
        severity: "safe",
        undo: "Edit or clear the text: it re-saves on its own.",
        audited: true,
      },
      {
        label: "“Open WhatsApp” / “WhatsApp reminder” (bulk)",
        where: "Green button on a row, in the drawer, or in the bulk actions bar",
        does: "Opens WhatsApp to the customer with a pre-written message: reference, product list and total.",
        effects: [
          "Records nothing: the sale does not change — useful for a follow-up after the purchase.",
          "The button only appears if the sale has a phone number (an anonymous sale has none).",
          "In bulk, a WhatsApp tab opens for EACH ticked sale that has a phone — allow pop-ups if nothing opens.",
        ],
        severity: "safe",
      },
    ],
    flows: [
      {
        title: "Where journal rows come from — and how they leave",
        lanes: [
          [
            {
              label: "Counter sale",
              tone: "neutral",
              note: "You record it here: it is born already collected, stock drops on confirmation.",
            },
            {
              label: "Into the journal",
              tone: "ok",
              note: "Counted in today's and this month's revenue, margin frozen at the current cost.",
            },
          ],
          [
            {
              label: "Reservation (site or manual)",
              tone: "neutral",
              note: "Handled in the Reservations screen: WhatsApp contact, confirmation…",
            },
            {
              label: "Marked “Collected”",
              tone: "neutral",
              note: "The customer came in to pay: stock decremented, cost frozen.",
            },
            {
              label: "Into the journal",
              tone: "ok",
              note: "The row leaves the Reservations screen and joins this journal, at its pickup date.",
            },
          ],
          [
            {
              label: "Into the journal",
              tone: "ok",
              note: "Sale recorded…",
            },
            {
              label: "Cancelled",
              tone: "warn",
              note: "Stock restored automatically, sale removed from revenue. The row moves to Reservations › Cancelled — final.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "This screen shows ONLY collected sales. Pending, confirmed, expired or cancelled reservations live in the Reservations screen.",
      "A counter sale decrements stock immediately, unlike a reservation (which only decrements it at pickup). Double-check the drawer before confirming.",
      "A sale's prices are final from the moment it is confirmed: the adjustment pencil does not appear in the drawer (it only exists on the Reservations screen, while the order has not been collected). To fix a price, void the sale and record it again.",
      "The price suggested when adding a product is the current site price, promotions included — editable line by line BEFORE confirming only.",
      "“Free lines” (off-catalogue items) count towards the total and revenue, but never touch stock and have no cost for the margin.",
      "The express account is created before the sale: if recording the sale then fails, the account still exists. If the phone is already known, the existing account is reused without creating a duplicate.",
      "The “Account created” window is the only chance to pass on the setup link: closed without sending or copying, the link is lost (the account exists but the customer will not be able to access it on their own).",
      "The setup link signs straight into the customer's account: send it only to that customer, never to a third party.",
      "Voiding a sale is final and does not notify the customer; the voided row remains viewable in Reservations › Cancelled, with your name in the audit log.",
      "The revenue cards are based on the pickup date: a sale collected last month does not count towards “Revenue this month”, even if it is still listed below.",
      "An anonymous sale has no name and no phone: no WhatsApp button, and it can only be identified by its FAR-… reference. Write down the reference if the customer wants a follow-up.",
      "The void link at the bottom of the drawer is labelled “Cancel reservation” (a label shared with the Reservations screen), but the confirmation clearly says “Void sale”: it is the same action.",
    ],
  },
]
