import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "promotions",
    navLabel: "Promotions",
    title: "Promotions — dated discounts, visible across the whole store",
    route: "/admin/promotions",
    intro:
      "This screen manages discount campaigns: a percentage (e.g. −20%) or a fixed amount in pesos (e.g. −100 DOP), applied to specific products, a whole brand, a range or a tag, during a period you choose. As soon as a promotion is live, customers see the discounted price everywhere, with the old price crossed out and the discount percentage: catalogue, product page, homepage, favourites, cart, search. The discounted price is also the one recorded in the customer's reservation — and therefore the one accounting will count as the sale.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catalogue / Promotions" },
            { w: 4, kind: "button", label: "+ New promotion", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "text", label: "Discount campaigns (% or fixed amount) applied to targeted products…" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Name · Discount · Window · Targets · Status · pencil · trash", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "panel", label: "Badge: Live / Scheduled / Expired / Offline", hotspot: 3 },
            { w: 6, kind: "panel", label: "Pencil = edit · Trash = delete", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Drawer: name · % or DOP · value · start/end · Active checkbox · targets", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "“New promotion” button",
        desc: "Opens the creation drawer on the right. Nothing is saved until you click “Create promotion” at the bottom of the drawer.",
      },
      {
        n: 2,
        label: "Campaign list",
        desc: "One row per promotion: its name, the discount (with % or DOP), the “start → end” window, up to three targets (beyond that, a “+N” counter), and its status. The most recent are at the top.",
      },
      {
        n: 3,
        label: "Status badge",
        desc: "Calculated automatically, there is nothing to click: “Scheduled” before the start date, “Live” during the window, “Expired” after the end date, “Offline” if the “Active” checkbox is unticked. Only “Live” promotions change prices.",
      },
      {
        n: 4,
        label: "Buttons at the end of the row",
        desc: "The pencil opens the edit drawer (same fields as when creating). The trash deletes the campaign after a confirmation dialog.",
      },
      {
        n: 5,
        label: "Creation / edit drawer",
        desc: "Top to bottom: campaign name; choice of Percentage or Fixed amount; the value; the start and end dates and times; the “Active (visible on storefront)” checkbox; the Targets block. The bottom button stays greyed out as long as the name, the value, one of the two dates or at least one target is missing.",
      },
    ],
    workflows: [
      {
        title: "Launch a dated promotion",
        steps: [
          {
            title: "Open the drawer",
            body: "Click “New promotion” and give the campaign a clear name (e.g. “January sale”). This name is only visible in the admin.",
          },
          {
            title: "Choose the discount",
            body: "Percentage (100 at most) or fixed amount in DOP, then the value. A fixed amount larger than a product's price gives a price of 0, never a negative price.",
          },
          {
            title: "Set the window",
            body: "Fill in start and end (date and time). The end must be after the start. The promotion starts and stops on its own at these dates.",
          },
          {
            title: "Add the targets",
            body: "Pick the type: Product (search by name), Brand, Range or Tag (dropdown then “Add”). Targeting a brand or a range covers all its products, including those added to the catalogue later.",
          },
          {
            title: "Save",
            body: "Leave the “Active” checkbox ticked and click “Create promotion”. If the window is in progress, discounted prices appear on the store within a minute.",
          },
          {
            title: "Check on the site",
            body: "Open the page of an affected product on the public site: the discounted price shows with the old price crossed out and the discount badge.",
          },
        ],
      },
      {
        title: "Stop a promotion before its end date",
        steps: [
          {
            title: "Open the promotion",
            body: "In the list, click the pencil of the campaign you want to cut off.",
          },
          {
            title: "Untick “Active”",
            body: "Untick the “Active (visible on storefront)” checkbox. The campaign stays saved with all its dates and targets.",
          },
          {
            title: "Save",
            body: "Click “Save”. Products go back to their normal price on the store within a minute. The badge switches to “Offline”.",
          },
          {
            title: "Know what does not change",
            body: "Reservations already created during the promotion keep their discounted price: nothing moves for those customers or for accounting.",
          },
        ],
      },
      {
        title: "Change the discount of a running promotion",
        steps: [
          {
            title: "Open with the pencil",
            body: "The drawer opens pre-filled with the current settings, targets included.",
          },
          {
            title: "Change the value",
            body: "Adjust the percentage or the amount, or the window, or the targets. On save, the target list is replaced by the one shown in the drawer.",
          },
          {
            title: "Save and check",
            body: "The new price shows on the store within a minute. Only future reservations will use this new price: those already placed keep the old one.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Create a promotion",
        where: "“New promotion” button at the top of the page, then “Create promotion” at the bottom of the drawer",
        does: "Saves a new discount campaign with its name, its type (% or fixed amount), its value, its window, its active/inactive state and its target list.",
        effects: [
          "The campaign is saved in the database and appears at the top of the list.",
          "If the “Active” checkbox is ticked and the window is in progress, the discounted price applies across the whole store within a minute: crossed-out price + discount badge.",
          "Any reservation created during the promotion records the discounted price — that is the price the customer pays at the pharmacy and the one accounting counts, even if the promotion later stops or changes. Only a manual price adjustment, line by line, from the reservation can still change it.",
          "If a product is covered by several promotions, the lowest price for the customer applies (discounts do not stack).",
          "If a chosen target no longer exists (product deleted in the meantime), nothing is saved and the message “A selected target no longer exists” shows.",
        ],
        severity: "caution",
        undo: "Open the promotion and untick “Active” (or delete it): prices go back to normal within a minute. Reservations already created keep their discounted price, though.",
        audited: true,
        publicImpact: "The discounted price (with the old price crossed out and the −X% badge) shows everywhere: catalogue, product page, homepage, favourites, cart and search.",
        accountingImpact: "Reservations placed during the promotion are recorded at the discounted price: the revenue booked is the amount actually collected.",
      },
      {
        label: "Edit a promotion",
        where: "Pencil at the end of the row, then “Save” at the bottom of the drawer",
        does: "Replaces all the campaign's settings with the drawer's content: name, discount type and value, dates, “Active” checkbox, and the complete target list.",
        effects: [
          "The new settings apply right away; prices on the store follow within a minute.",
          "The target list is fully replaced: a target removed from the drawer stops getting the discount as soon as you save.",
          "Reservations already created do not move: their price was frozen the moment the customer reserved.",
          "If one of the displayed targets matches an item deleted from the catalogue, the save is refused: first remove the target marked “(deleted)”.",
        ],
        severity: "caution",
        undo: "Reopen the promotion and put back the previous values (they can also be looked up in the audit log).",
        audited: true,
        publicImpact: "The new discounted prices replace the old ones across the whole site within a minute.",
        accountingImpact: "Only future reservations use the new price; sales already recorded keep theirs.",
      },
      {
        label: "Take offline / put back online (“Active” checkbox)",
        where: "“Active (visible on storefront)” checkbox in the edit drawer, then “Save”",
        does: "Cuts off or restarts the discount immediately, without touching the dates or the targets. It is the campaign's main switch.",
        effects: [
          "Unticked: the discount stops even if the window is not over; products go back to their normal price on the store within a minute; the badge switches to “Offline”.",
          "Ticked again: the discount restarts right away, as long as the window is still in progress (otherwise the badge shows “Scheduled” or “Expired” and nothing changes for the customer).",
          "Reservations already created keep their discounted price in both cases.",
        ],
        severity: "caution",
        undo: "Tick (or untick) the checkbox and save again: the effect is immediate and the campaign is never lost.",
        audited: true,
        publicImpact: "Turns the discounted price display on or off across the whole public site.",
      },
      {
        label: "Delete a promotion",
        where: "Trash at the end of the row, then confirmation in the “Delete” dialog",
        does: "Permanently erases the campaign and its target list from the database, after confirmation.",
        effects: [
          "The campaign disappears from the list and cannot be restored: to relaunch it, you will have to recreate it entirely.",
          "Discounted prices go back to the normal price on the store within a minute.",
          "Reservations and sales already recorded keep their discounted price: customer history and accounting do not change.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "The affected products go back to their normal price across the whole public site.",
        accountingImpact: "No effect on past sales: their price was frozen at the moment of each reservation.",
      },
    ],
    flows: [
      {
        title: "Lifecycle of a promotion",
        lanes: [
          [
            {
              label: "Scheduled",
              tone: "neutral",
              note: "The start date has not arrived yet: the campaign is saved but has no effect on the store.",
            },
            {
              label: "Live",
              tone: "ok",
              note: "Window in progress and “Active” checkbox ticked: discounted price + crossed-out price on the store, reservations recorded at the discounted price.",
            },
            {
              label: "Expired",
              tone: "neutral",
              note: "At the end date and time, the discount stops on its own. The campaign stays in the list for the record.",
            },
          ],
          [
            {
              label: "Offline",
              tone: "warn",
              note: "“Active” checkbox unticked: the discount is cut off immediately, whatever the window. Tick the checkbox again to restart it.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "There is no switch in the list: to cut off or restart a promotion, open it with the pencil and tick/untick “Active”, then save.",
      "Several promotions on the same product never stack: the lowest price for the customer applies.",
      "The price paid is the one at the moment the customer reserves: they keep their discounted price even if you stop the promotion afterwards. Conversely, a cart filled during the promotion but reserved after the end pays the normal price.",
      "The end date is excluded: exactly at the end time, the discount no longer applies. The end must be after the start, and a percentage cannot exceed 100.",
      "A fixed amount larger than a product's price gives a price of 0 DOP, never a negative price — double-check the value when targeting a whole brand whose prices vary.",
      "Targeting a brand, a range or a tag automatically covers all attached products, including those added to the catalogue after the promotion was created.",
      "If a targeted item has been deleted from the catalogue, it shows as “(deleted)” in the list, and you will have to remove that target before you can save any change to the campaign.",
      "Price changes appear on the store within a minute: if you see nothing, wait a few moments and reload the public page.",
    ],
  },
]
