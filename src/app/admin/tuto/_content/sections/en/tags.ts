import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "tags",
    navLabel: "Tags",
    title: "Tags — the catalogue's filters and needs",
    route: "/admin/tags",
    intro:
      "Tags sort products by theme: needs (hydration, anti-aging…), skin types, ingredients, and so on. They are organised in two levels: tag types (the families), each containing tags. This screen is for creating, renaming and deleting types and tags. Careful: you do NOT attach tags to products here — that happens in each product's sheet, on the Products page. What you do here feeds the public site: the catalogue filters, the needs pages and the needs cards on the homepage. (Tags are never displayed on the site's product sheets, though: they are for filtering, not describing.)",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "Admin / Catalogue / Tags", hotspot: 1 },
            { w: 4, kind: "button", label: "+ New tag type", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Types", hotspot: 3 },
            { w: 3, kind: "kpi", label: "Tags" },
            { w: 3, kind: "kpi", label: "● Besoins" },
            { w: 3, kind: "kpi", label: "● Types de peau" },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "panel", label: "● Besoins · 14 tags", hotspot: 4 },
            { w: 2, kind: "button", label: "✎ · 🗑", hotspot: 5 },
            { w: 3, kind: "button", label: "+ Tag", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Hydratation · page address · ✎ 🗑 on hover", hotspot: 7 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "● Types de peau — next card, same structure" },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Header",
        desc: "Breadcrumb “Admin / Catalogue / Tags” and the page title. Nothing to change here.",
      },
      {
        n: 2,
        label: "“New tag type” button",
        desc: "Opens a window to create a new family: name, page address (filled in automatically while you type the name), icon, colour, and — optionally — a first tag created in the same go.",
      },
      {
        n: 3,
        label: "Number cards",
        desc: "Number of types, total number of tags, then the detail of the first two types. Recalculated on every display — read only.",
      },
      {
        n: 4,
        label: "A type's card",
        desc: "Each tag type has its own card: colour dot, name, number of tags and page address. The type's tags are listed below.",
      },
      {
        n: 5,
        label: "The type's pencil and trash",
        desc: "The pencil edits the type (name, address, icon, colour). The trash deletes it — it is greyed out and unusable as long as the type still contains at least one tag.",
      },
      {
        n: 6,
        label: "“Tag” button",
        desc: "Creates a new tag directly in this type. The window that opens is titled “New tag”.",
      },
      {
        n: 7,
        label: "Tag row",
        desc: "The tag's name and, below it, its page address. The pencil (edit) and the trash (delete) only appear when you hover over the row with the mouse.",
      },
    ],
    workflows: [
      {
        title: "Create a new filter family",
        steps: [
          {
            title: "Create the type",
            body: "Click “New tag type”. Give it a clear name (the address fills in by itself), pick an icon and a colour — they are only used on this screen. You can create the first tag in the same window.",
          },
          {
            title: "Add its tags",
            body: "On the new type's card, click “Tag” and create the values one by one (for example, for a “Texture” type: cream, gel, oil…).",
          },
          {
            title: "Tag the products",
            body: "Go to the Products page, open each relevant sheet and tick the new tags in the dedicated area. This is the step that links products to the filters.",
          },
          {
            title: "Check the site",
            body: "In the public catalogue, the new filter family shows up in the left column within about a minute. Careful: the tags appear there even with no products at all (the counter shows 0).",
          },
        ],
      },
      {
        title: "Add a new need (e.g. “Sensitive skin”)",
        steps: [
          {
            title: "Create the tag in the “Besoins” type",
            body: "On the “Besoins” (needs) card, click “Tag”, type the name and check the suggested address: it will form the public /besoins/… link of the page dedicated to that need.",
          },
          {
            title: "Link products",
            body: "On the Products page, tick this tag on every relevant product. With no products linked, the need's page exists but displays empty.",
          },
          {
            title: "Know what does not move by itself",
            body: "The “Needs” menu in the site's navigation bar is a fixed list of five entries: your new need will not appear there automatically. Customers reach it through the catalogue filters or a direct link.",
          },
        ],
      },
      {
        title: "Delete a tag you no longer need",
        steps: [
          {
            title: "Measure the impact before clicking",
            body: "Deletion instantly removes the tag from ALL the products that carry it, with no checklist beforehand. If in doubt, first check in the public catalogue how many products are affected using the matching filter.",
          },
          {
            title: "Delete and confirm",
            body: "Hover over the tag's row, click the trash, then confirm in the window, which reminds you that the tag will be removed from all associated products.",
          },
          {
            title: "Understand that it is final",
            body: "Recreating a tag with the same name later does NOT bring back the links with the products: you would have to re-tag each sheet one by one on the Products page.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "New tag type",
        where: "Button at the top right of the screen (opens a window in the centre)",
        does: "Creates a new tag family: name, page address, icon, colour, and optionally a first tag.",
        effects: [
          "The type is saved in the database; if the name or address is already taken by another type, creation is refused with a message.",
          "If you filled in the “Initial tag” field, a first tag is created right away inside the type.",
          "The type immediately appears as a new card on this screen and in the counters.",
          "As long as the type contains no tags, it is invisible to customers. As soon as it contains one, a new filter family appears in the public catalogue, within about a minute.",
          "The customer-facing title of that family is derived from the type's address (dashes replaced by spaces) — not from the name entered here. For the historic families (needs, skin types, ingredients…), the site shows its own translation.",
        ],
        severity: "caution",
        undo: "First delete the initial tag if there is one, then the type itself with the trash.",
        audited: true,
        publicImpact: "With at least one tag, a new filter family appears in the public catalogue within about a minute.",
      },
      {
        label: "Edit type (pencil)",
        where: "Pencil icon in the header of each type card",
        does: "Changes the type's name, page address, icon and colour.",
        effects: [
          "The name, icon and colour only change what this admin screen shows — they are never shown to customers.",
          "If the new name or address is already taken by another type, the change is refused with a message.",
          "Changing the address of a type you created yourself is low risk: only the title of the catalogue filter family and the filter links already shared depend on it.",
          "However, do not change the address of the historic types. The “types-peau” address is used as-is by the “Catalogue” menu in the site's navigation bar (skin types column): changing it would break those menu links. And the “types-peau”, “ingredients” and “categories” addresses trigger the family's translated title in the filters.",
          "CRITICAL EXCEPTION: never change the address of the “besoins” type. All the public /besoins/… pages and the site's “Needs” menu links rely on that exact address: changing it would show “page not found” everywhere, and the needs cards on the homepage would lead to an unfiltered catalogue.",
        ],
        severity: "caution",
        undo: "Reopen the type with the pencil and put the old values back, in particular the old address.",
        audited: true,
        publicImpact: "Changing the address of the “besoins” type would break every /besoins/… page on the site.",
      },
      {
        label: "Delete type (trash)",
        where: "Trash icon in the header of each type card",
        does: "Permanently deletes an EMPTY tag type, after confirmation.",
        effects: [
          "The trash is greyed out and unusable as long as the type contains at least one tag; even if forced, the server refuses with a message saying the type still contains tags. You must delete its tags one by one first.",
          "The confirmation window says that “this type and all its tags will be deleted” — in reality, deletion is only possible once the type is already empty. So no tag can ever disappear through this action.",
          "If the type is empty, it is permanently erased from the database and disappears from the screen and the counters.",
          "No impact on the public site: a type with no tags was not displayed there anyway.",
        ],
        severity: "caution",
        undo: "Recreate a type with the same name, address, icon and colour: nothing else was stored.",
        audited: true,
      },
      {
        label: "Tag (the “+” button on each card)",
        where: "Header of each type card (opens the “New tag” window)",
        does: "Creates a tag in this type, with a name and a page address.",
        effects: [
          "The tag is saved in the database, attached to the card's type (the type cannot be changed in the window).",
          "The address fills in automatically from the name; two tags of the same type cannot share the same address (a message says the tag already exists), but two different types can.",
          "The tag immediately appears in the card's list and in the counters.",
          "It appears in the public catalogue filters within about a minute — EVEN with no products linked (the filter's counter then shows 0).",
          "If it is created in the “Besoins” type, a public /besoins/… page becomes reachable at its address (empty as long as no product carries the tag).",
          "It becomes tickable on the product sheets of the Products page: that is where — not here — you attach it to products.",
        ],
        severity: "caution",
        undo: "Delete the tag with the trash — harmless as long as no product has been linked to it.",
        audited: true,
        publicImpact: "The tag appears in the public catalogue filters within about a minute, even with zero products.",
      },
      {
        label: "Edit tag (pencil)",
        where: "Pencil icon when hovering over each tag row",
        does: "Changes the tag's name and page address. The type it belongs to cannot be changed.",
        effects: [
          "The new name replaces the old one everywhere it shows: catalogue filters, the title of the need's page and the homepage card where relevant (product sheets, for their part, do not display tags). The public site follows within about a minute.",
          "Unlike at creation time, the address no longer follows the name: it stays as it is until you change it yourself — on purpose, so existing links do not break.",
          "If you change the address of a tag in the “Besoins” type, its public /besoins/… page moves: the old address shows “page not found” (including links already shared and Google results).",
          "If the new address is already taken by another tag of the same type, the change is refused with a message.",
          "Linked products stay linked: only the name and address change, no link is lost.",
          "A tag cannot be moved to another type: you would have to delete it then recreate it elsewhere — losing its links with the products.",
        ],
        severity: "caution",
        undo: "Reopen the tag with the pencil and put the old name and address back.",
        audited: true,
        publicImpact: "The name changes everywhere on the site; an address change breaks old links to the need's page.",
      },
      {
        label: "Delete tag (trash)",
        where: "Trash icon when hovering over each tag row",
        does: "Permanently deletes the tag, after confirmation.",
        effects: [
          "A confirmation window warns: “This tag will be removed from all associated products”.",
          "Deletion erases the tag AND all its links with products, automatically and in one go — whether it sits on 1 or 100 products, with no checklist beforehand.",
          "Recreating a tag with the same name later restores NOTHING: products do not get it back; you must re-tag each sheet by hand on the Products page.",
          "On the public site (within about a minute): the tag disappears from the catalogue filters; if it was a need, its /besoins/… page shows “page not found”.",
          "If the tag was one of the three needs featured on the homepage, its card disappears and the homepage falls back to a predefined backup selection.",
          "If it was one of the five needs in the navigation bar's “Needs” menu (Hydration, Anti-aging, Sun protection, Acne & blemishes, Dark spots), the menu link stays visible but leads to “page not found”.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "The tag and its product links disappear from the site; a /besoins/… page may become unreachable.",
      },
    ],
    gotchas: [
      "This screen manages the vocabulary, not the links: to attach or remove a tag on a product, go through the product's sheet on the Products page.",
      "Deleting a tag is the riskiest action on this screen: it instantly detaches every product that carries it, and recreating the tag does not bring those links back. There is no recycle bin.",
      "A tag shows in the public catalogue filters even with no products at all (counter at 0). Avoid creating tags “for later”: customers see them.",
      "The “besoins” type is special: its address powers all the public /besoins/… pages and the links of the needs cards on the homepage. Never change its address, and think twice before touching the tags it contains.",
      "The “Needs” menu in the site's navigation bar is a fixed list of five entries (Hydration, Anti-aging, Sun protection, Acne & blemishes, Dark spots): creating a new need does not add it there, and deleting or changing the address of one of those five breaks the menu link.",
      "The three needs cards on the homepage match tags flagged as “featured” directly in the database: that setting is NOT editable from this screen — see the technical manager to change the selection.",
      "A type's icon and colour are only there to tell the cards apart on this admin screen: customers never see them.",
      "The confirmation window for deleting a type says its tags would be deleted with it — that is misleading: in practice, a type's trash is only clickable once the type is already empty, and the server refuses to delete a type that contains tags anyway.",
      "A tag cannot change type after it is created: the pencil only edits the name and the address. Moving it = deleting then recreating it, losing the product links.",
      "The public site updates by itself within about a minute (catalogue, needs pages, homepage). No need to reload over and over.",
      "In the create and edit windows, the “Slug” field is simply the page's address on the site.",
    ],
  },
]
