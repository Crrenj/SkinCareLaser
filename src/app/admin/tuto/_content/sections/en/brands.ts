import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "brands",
    navLabel: "Brands & ranges",
    title: "Brands and ranges — the backbone of the catalogue",
    route: "/admin/marques",
    intro:
      "This screen organises the catalogue on two levels: each brand contains ranges, and each product is attached to a range (attaching the product happens on the Products page). Here you create, rename and delete brands and their ranges. What you do here shows on the public site: the “Brands” page, each brand's page, the catalogue filters, the product pages and the brand strip on the homepage.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catalogue / Brands", hotspot: 1 },
            { w: 4, kind: "button", label: "+ Add brand", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "toolbar", label: "Search by name or slug…", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Brands", hotspot: 4 },
            { w: 4, kind: "kpi", label: "Ranges" },
            { w: 4, kind: "kpi", label: "Ranges / brand" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "› Brand · Slug · Ranges (+) · pencil · trash", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 1, kind: "text", label: "└" },
            { w: 11, kind: "table", label: "Expanded ranges · pencil · trash", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Header",
        desc: "Breadcrumb “Admin / Catalogue / Brands” and the page title. Nothing to change here.",
      },
      {
        n: 2,
        label: "“Add brand” button",
        desc: "Opens a panel on the right to create a new brand: name + the page's address on the site (the “Slug” field). The address fills in by itself as you type the name.",
      },
      {
        n: 3,
        label: "Search",
        desc: "Filters the brand list by name or page address, instantly. It is just a display filter: it changes nothing.",
      },
      {
        n: 4,
        label: "Three number cards",
        desc: "Number of brands, total number of ranges, and average ranges per brand. Recalculated every time the page loads — read-only.",
      },
      {
        n: 5,
        label: "Brand row",
        desc: "From left to right: the arrow expands or collapses the brand's ranges; the name; the page address (“Slug” column); the number of ranges followed by a green “+” button that creates a range attached directly to that brand; then the pencil (edit) and the trash can (delete).",
      },
      {
        n: 6,
        label: "Range rows",
        desc: "When a brand is expanded, its ranges appear below it, slightly indented: name, page address, a “Range” pill, then each range's own pencil and trash can.",
      },
    ],
    workflows: [
      {
        title: "List a new brand",
        steps: [
          {
            title: "Create the brand",
            body: "Click “Add brand”. Type the name: the page address fills in automatically. Check it (it will form the public link /marques/...), then save.",
          },
          {
            title: "Create its first range",
            body: "On the brand's row, click the green “+” in the Ranges column. The brand is already pre-filled and cannot be changed. Give the range a name and save.",
          },
          {
            title: "Attach the products",
            body: "Go to the Products page to create or edit products and assign them this range. Without an active product, the brand and the range do not yet appear in the public catalogue filters.",
          },
          {
            title: "Check the site",
            body: "The new brand appears on the public “Brands” page within a few minutes, even with no products. So avoid creating the brand long before its products: its card would show “0 products”.",
          },
        ],
      },
      {
        title: "Rename a brand without breaking links",
        steps: [
          {
            title: "Open the brand",
            body: "Click the pencil on the brand's row.",
          },
          {
            title: "Change only the name",
            body: "When editing, the page address does not follow the name: this is intentional. Leave it as is so that links already shared and indexed keep working.",
          },
          {
            title: "Save",
            body: "The new name shows everywhere: in the admin immediately, on the public site within one to five minutes depending on the page.",
          },
        ],
      },
      {
        title: "Delete a brand cleanly",
        steps: [
          {
            title: "Empty the ranges of their products",
            body: "A range cannot be deleted while a product is attached to it — even a deactivated product. On the Products page, change those products' range or delete them.",
          },
          {
            title: "Delete each range",
            body: "Expand the brand and delete its ranges one by one with the trash can. As long as one range remains, deleting the brand is refused with an explanatory message.",
          },
          {
            title: "Delete the brand",
            body: "Click the brand's trash can and confirm. Deletion is permanent; the brand disappears from the public “Brands” page within a few minutes.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Add brand",
        where: "Button at the top right of the screen (opens a panel on the right)",
        does: "Creates a new brand with a name and a page address on the site.",
        effects: [
          "The brand is saved to the database; the page address is automatically lowercased.",
          "If another brand already uses that name or address, creation is refused with a message — nothing is created.",
          "The brand immediately appears in the list and in the screen's counters.",
          "It appears on the public “Brands” page within five minutes at most, even with no products at all (its card then shows 0 products), as well as in the scrolling brand strip on the homepage (if that section is enabled).",
          "It only appears in the public catalogue filters once at least one active product is attached to it through a range.",
          "Its row immediately gets its own “+” button to create ranges for it; it also appears in the list of parent brands when you edit an existing range.",
        ],
        severity: "caution",
        undo: "Delete the brand with the trash can: this works without any obstacle as long as no range is attached to it.",
        audited: true,
        publicImpact: "The brand becomes visible on the public “Brands” page within a few minutes, even empty.",
      },
      {
        label: "Edit brand (pencil)",
        where: "Pencil icon on the right of each brand row",
        does: "Changes the brand's name and/or page address.",
        effects: [
          "The new name replaces the old one on the admin list, the public “Brands” page, the brand's page, the catalogue filters, the product pages and the homepage strip (one exception: the navigation menu, see the pitfalls).",
          "The public site updates by itself within one to five minutes depending on the page.",
          "If you change the page address, the brand's page moves: the old address shows “page not found”. Links already shared and Google results point to nothing until they are updated.",
          "If the name or address is already taken by another brand, the change is refused with a message.",
        ],
        severity: "caution",
        undo: "Reopen the brand with the pencil and put back the old name and address.",
        audited: true,
        publicImpact: "Name visible everywhere on the site; changing the address breaks old links to the brand's page.",
      },
      {
        label: "Delete brand (trash can)",
        where: "Trash can icon on the right of each brand row",
        does: "Permanently deletes the brand, after confirmation.",
        effects: [
          "A confirmation window shows up first.",
          "Deletion is refused as long as the brand contains at least one range: a message asks you to delete the ranges first.",
          "Since a range is itself protected while it has products, a brand that still has products can never be deleted by accident from this screen.",
          "If nothing blocks it, the brand is permanently erased from the database.",
          "It disappears from the list, the counters, the public “Brands” page and the homepage strip within a few minutes.",
        ],
        severity: "danger",
        undo: "Recreate a brand with exactly the same name and page address: its public page reappears identically (the name and the address are the only two pieces of brand information the site uses).",
        audited: true,
        publicImpact: "The brand and its page disappear from the public site within a few minutes.",
      },
      {
        label: "Add range (green “+” button)",
        where: "Ranges column of each brand row (opens a window in the centre)",
        does: "Creates a range attached to that brand — the brand is pre-filled and locked.",
        effects: [
          "The range is saved to the database, attached to the brand.",
          "If a range of the same brand already uses that page address, creation is refused (two different brands can however have ranges with the same name).",
          "The range appears in the brand's expanded list and in the counters.",
          "It becomes selectable as a product's range on the Products page.",
          "It only appears in the public catalogue's “Ranges” filter once at least one active product is attached to it — empty, it is invisible to customers.",
        ],
        severity: "safe",
        undo: "Delete the range with the trash can: this works without any obstacle as long as no product is attached to it.",
        audited: true,
      },
      {
        label: "Edit range (pencil)",
        where: "Pencil icon on each range row (brand expanded)",
        does: "Changes the name, the page address, and — only here — the range's parent brand.",
        effects: [
          "The new name is picked up by the catalogue filters and the product pages within about a minute. A range's address, though, is not displayed anywhere on the site: changing it has no public effect.",
          "Unlike at creation, the parent brand can be changed here: switching brands moves the range AND all its products under the other brand.",
          "After a move, those products change brand page on the public site and family in the catalogue filters.",
          "If the page address is already taken by another range of the chosen brand, the change is refused with a message.",
        ],
        severity: "caution",
        undo: "Reopen the range with the pencil and put back the old values, including the parent brand.",
        audited: true,
        publicImpact: "The range's name feeds the catalogue filters; changing the parent brand moves all its products under the other brand on the site.",
      },
      {
        label: "Delete range (trash can)",
        where: "Trash can icon on each range row (brand expanded)",
        does: "Permanently deletes the range, after confirmation.",
        effects: [
          "A confirmation window shows up first.",
          "Deletion is refused as long as at least one product is attached to the range — deactivated products count too. First change those products' range or delete them on the Products page.",
          "If nothing blocks it, the range is permanently erased from the database.",
          "If it was the brand's last range, the brand becomes deletable again in turn.",
        ],
        severity: "danger",
        undo: "Recreate a range with the same name and page address, attached to the same brand.",
        audited: true,
      },
    ],
    gotchas: [
      "There is no brand logo to upload on this screen: on the public “Brands” page, each brand's card is automatically illustrated with a photo of one of its active products. To change that image, work on the products' photos.",
      "The page address (“Slug” column) is generated by itself from the name at creation, but no longer follows the name when editing — this is intentional, to avoid breaking existing links. Avoid changing it for a brand that is already published. For a range, this address is just an internal identifier: a range has no page of its own on the site, and the catalogue filters are based on its name.",
      "A brand created without products still appears on the public “Brands” page, with “0 products” on its card. Create the brand, its ranges and its products in one go.",
      "The public catalogue filters only show a brand or a range if it has at least one active product. An empty range is invisible to customers.",
      "Deletions are permanent: there is no recycle bin. The safeguards do however block deleting a brand that has ranges, and a range that has products — including deactivated products.",
      "The public site updates by itself: the “Brands” page within five minutes at most, a brand's page and the catalogue within about a minute. No need to keep reloading.",
      "Two brands cannot share the same name or the same page address. Two ranges of the same brand cannot share the same address, but two different brands can have ranges with the same name.",
      "The search bar at the top of the screen only filters what the list shows: it changes nothing and does not touch the public site.",
      "The big “Catalogue” menu in the public navigation features four brands (Avène, ISDIN, Filorga, Uriage) hard-coded in the code: renaming one of them or changing its address does not update that menu, and its link can then lead to “page not found”. Tell the developer if one of these four brands changes.",
    ],
  },
]
