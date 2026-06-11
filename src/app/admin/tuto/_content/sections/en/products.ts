import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "products",
    navLabel: "Products",
    title: "Products — the catalogue's product sheets",
    route: "/admin/product",
    intro:
      "This screen is the heart of the catalogue: the list of all the pharmacy's product sheets, with brand, tags, price and stock. This is where you create a sheet, fix a name, a price, a photo or a description, and where you delete a product. Keep in mind that almost everything you save here shows on the public site within about a minute. Putting a hidden product online, however, does not happen here: it is a deliberate action, grouped with the inventory in the Stock screen.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin › Catalogue › Products" },
            { w: 4, kind: "button", label: "+ Add product", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "Search by name, SKU…", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "table", label: "Product · Brand · Tags · Price · Stock · Status", hotspot: 3 },
            { w: 3, kind: "panel", label: "Pencil · Trash", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "text", label: "Page 1 of 36" },
            { w: 5, kind: "tabs", label: "1 2 3 …", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "text", label: "Dimmed background" },
            { w: 7, kind: "drawer", label: "“New product / Edit” drawer", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Add product",
        desc: "Opens the “New product” drawer on the right. Nothing is created until you click “Create product” at the very bottom of the drawer.",
      },
      {
        n: 2,
        label: "Search",
        desc: "Filters the list on the product name and description (despite the “SKU” mention in the field). The list automatically goes back to page 1. Type words with their exact accents: “creme” will not find “crème”.",
      },
      {
        n: 3,
        label: "The product list",
        desc: "Each row shows the photo, the name and page address, the brand, up to 3 tags (then a “+n” counter), the price in pesos, the stock in units and a stock status pill: Normal, Low stock (row tinted yellow) or Out of stock (row tinted red). 10 products per page, newest first. Careful: products hidden from the public also appear in this list, with no distinguishing mark.",
      },
      {
        n: 4,
        label: "Pencil and trash",
        desc: "At the end of the row: the pencil opens the sheet pre-filled for editing; the trash asks for a confirmation then deletes the product permanently.",
      },
      {
        n: 5,
        label: "Pagination",
        desc: "At the bottom of the list: “Page X of Y” and numbered buttons to change pages.",
      },
      {
        n: 6,
        label: "The product sheet drawer",
        desc: "The create and edit form, in 4 blocks: Information (name, page address, PNG image, short description), Inventory (selling price in pesos, stock), Brand & range (the range unlocks after you pick the brand), and the product tags. At the bottom: “Cancel” and “Save” or “Create product”. The “Unsaved” mention reminds you that nothing is saved until you confirm.",
      },
    ],
    workflows: [
      {
        title: "Create a new product",
        steps: [
          {
            title: "Open the form",
            body: "Click “Add product” at the top right. The “New product” drawer opens.",
          },
          {
            title: "Enter the name",
            body: "The page address fills in automatically from the name — only touch it if needed. Add a short description if you have one.",
          },
          {
            title: "Set the real price and the stock",
            body: "Selling price in pesos and stock are required. Do not leave a temporary price: the product will be online as soon as you save.",
          },
          {
            title: "Pick brand, range and tags",
            body: "If you pick a brand without picking a range, the brand's first range is assigned automatically. Tick the tags (need, skin type…): they are what makes the product show up in the public catalogue filters.",
          },
          {
            title: "Add the photo",
            body: "A single file, in PNG format. It will be published on the site with the sheet.",
          },
          {
            title: "Create and check",
            body: "Click “Create product”. If another product already has the same page address, the save is refused: change it and try again. The sheet appears on the public site within about a minute.",
          },
        ],
      },
      {
        title: "Fix a sheet (price, photo, text)",
        steps: [
          {
            title: "Find the product",
            body: "With the search (words with their exact accents) or by browsing the pages.",
          },
          {
            title: "Open the sheet",
            body: "Click the pencil at the end of the row: the drawer opens, pre-filled.",
          },
          {
            title: "Make your changes",
            body: "Name, description, price, stock, brand and range (to change the brand, also pick a range — otherwise the change is silently ignored), tags. Careful with the photo: uploading a new one erases ALL the sheet's existing photos, with no way back.",
          },
          {
            title: "Save",
            body: "Click “Save” at the bottom of the drawer. The public site reflects the changes within about a minute.",
          },
          {
            title: "Special case: the price",
            body: "Reservations already placed keep the old price, frozen at the time of the reservation. Only new reservations take the new price.",
          },
        ],
      },
      {
        title: "Put a still-hidden product on sale",
        steps: [
          {
            title: "Go to the Stock screen",
            body: "Going online does not happen from the Products screen: it is grouped with the opening inventory in the Stock screen.",
          },
          {
            title: "Open “Initialize this product”",
            body: "On the product's row, click the “Initialize this product” action: a dedicated drawer opens.",
          },
          {
            title: "Count and put numbers in",
            body: "Enter the quantity counted on the shelf. If you have the invoice, add the unit purchase cost (the margin will be known from the first sale). Also enter the real selling price if the temporary price needs replacing.",
          },
          {
            title: "Check the “Activate product” box then confirm",
            body: "The “Activate product” box is already ticked when the drawer opens — untick it if the product should not go online yet. Click “Initialize”: the product becomes visible and reservable on the site within about a minute, and the operation is recorded in the activity log.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Add product → “Create product”",
        where: "Button at the top right of the screen, then the confirm button at the bottom of the drawer",
        does: "Creates a new product sheet in the catalogue.",
        effects: [
          "The sheet is saved to the database and the product is ONLINE immediately: it appears in the public catalogue, in search and on its own page within about a minute.",
          "Name, price (in pesos) and stock are required; the page address is derived from the name but can still be edited before you confirm.",
          "If another product already has the same page address, the save is refused — change it and try again.",
          "Brand with no range picked: the brand's first range is assigned automatically.",
          "The photo (PNG only) is published to the site's public storage; the ticked tags are attached to the sheet.",
          "The stock entered here is set as-is, with no purchase cost or supplier invoice: nothing feeds the accounting. For a real delivery, use the stock entry in the Stock screen.",
        ],
        severity: "caution",
        undo: "Delete the sheet with the trash icon in the list (permanent deletion — harmless right after a creation).",
        audited: true,
        publicImpact: "The product appears on the public site as soon as it is saved (about a minute).",
        accountingImpact: "No accounting entry: the stock entered here has no purchase cost or invoice — margins and the 606 register never see those units.",
      },
      {
        label: "Pencil → “Save” (edit a sheet)",
        where: "Pencil icon at the end of the row, then the “Save” button at the bottom of the drawer",
        does: "Updates the sheet: name, page address, description, price, stock, brand, range, photo, tags.",
        effects: [
          "The modified fields are written to the database; the public site reflects them within about a minute.",
          "Changing the name does NOT change the page address: it keeps its original value unless you edit it yourself (refused if another product already uses it).",
          "Changing the brand alone is silently ignored: when editing, the change only takes effect if you also pick a range from the new brand (unlike creation, no range is assigned automatically).",
          "Uploading a new photo first erases ALL the product's existing photos (some imported sheets have several), then publishes the single new one. The old ones are lost for good.",
          "The ticked tags fully replace the old ones.",
          "Reservations already placed keep the price frozen at the time of the reservation: only the future takes the new price.",
          "Editing the stock figure here overwrites it as-is, with no purchase cost and no trace for the accounting — for a supplier delivery, use the stock entry in the Stock screen.",
        ],
        severity: "caution",
        undo: "Reopen the sheet and re-enter the old values. Exception: replaced photos are permanently erased.",
        audited: true,
        publicImpact: "Price, texts, photo and tags change on the public site within about a minute.",
        accountingImpact: "No accounting entry: the stock overwritten here has no purchase cost and no trace in the 606 register, and past sales keep their frozen price and cost.",
      },
      {
        label: "Trash (delete a product)",
        where: "Trash icon at the end of the row, with a confirmation window",
        does: "Permanently deletes the product sheet and everything attached to it.",
        effects: [
          "A window asks for confirmation; once confirmed, there is no way back.",
          "The product's photos are erased from the site's public storage, then the sheet is deleted from the database.",
          "The product disappears from the public site, from customers' current carts (without warning them) and from their favorites lists; its customer reviews are deleted.",
          "The product's stock reception history is erased: the matching purchases disappear from the 606 register of past months. Its declared losses register is erased too (expenses already booked stay in the accounting).",
          "Past sales and reservations are kept: each line keeps the name and price recorded at the time of the sale. Past months' revenue and margins do not move.",
          "Recreating the product by hand gives a blank sheet: the erased history does not come back.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "The product disappears from the catalogue, from current carts and from customers' favorites.",
        accountingImpact: "The product's purchases disappear from the 606 register of past months; revenue and margins already recorded stay intact.",
      },
      {
        label: "“Activate product” (going online)",
        where: "Stock screen → “Initialize this product” action on the row → “Activate product” box in the drawer",
        does: "Makes a hidden product visible and reservable on the public site.",
        effects: [
          "The product appears in the public catalogue, in search and on its own page within about a minute.",
          "It is a deliberate, separate action: the edit form in the Products screen cannot change a product's visibility.",
          "The drawer gathers everything that needs doing beforehand: counted stock, purchase cost if any, real selling price. Careful: the “Activate product” box is ticked by default when the drawer opens — untick it if those points are not settled yet.",
          "There is no reverse box: once online, no button can hide the product again (only deletion removes it from the site).",
        ],
        severity: "caution",
        audited: true,
        publicImpact: "The product becomes visible and reservable by every visitor of the site.",
      },
    ],
    flows: [
      {
        title: "The life of a product sheet",
        lanes: [
          [
            {
              label: "Created in this screen",
              tone: "neutral",
              note: "Online as soon as it is saved, with no review step.",
            },
            {
              label: "Online",
              tone: "ok",
              note: "Visible in the catalogue, reservable, present in search.",
            },
            {
              label: "Deleted",
              tone: "bad",
              note: "Disappears from the site, carts and favorites; purchase history erased.",
            },
          ],
          [
            {
              label: "Hidden (offline)",
              tone: "warn",
              note: "Present in the admin but invisible to the public — often with a temporary price to fix.",
            },
            {
              label: "Initialized — Stock screen",
              tone: "neutral",
              note: "Stock counted, purchase cost and real selling price set.",
            },
            {
              label: "Put online",
              tone: "ok",
              note: "Deliberate action, recorded in the activity log.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "Many imported sheets show a temporary price of 100 pesos set when the catalogue was loaded. Replace it with the real selling price before featuring the product or putting it online.",
      "A product created from this screen is online immediately: have the real price and the right stock ready BEFORE clicking “Create product”.",
      "The “Status” column shows the stock state (Normal / Low stock / Out of stock), not the product's visibility: a product hidden from the public appears in the list with no distinguishing mark.",
      "There is no button to hide a product that is online: only (permanent) deletion removes it from the site. Going online, on the other hand, happens from the Stock screen (“Initialize this product” drawer).",
      "The form accepts only ONE photo, in PNG format. Uploading a new one erases all the sheet's existing photos — including imported sheets that had several.",
      "Editing the stock from the sheet records neither purchase cost nor invoice: the accounting (margins, 606 register) stays blind to those units. For a real delivery, use “Stock entry” in the Stock screen.",
      "The list search is accent-sensitive and looks at the name and description (not an internal reference, despite the “SKU” mention in the field).",
      "The crossed-out price and the discounts shown on the site come from the Promotions screen, not from this form: the price entered here is the base price.",
      "The “new” and “featured” badges, the pharmacist's advice and the detailed characteristics (volume, texture…) cannot be set in any admin screen for now. Filtering information (skin type, need…) goes through the tags.",
    ],
  },
]
