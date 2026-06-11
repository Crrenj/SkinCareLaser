import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "home",
    navLabel: "Homepage",
    title: "Homepage — sections, promo banners and preview",
    route: "/admin/annonce",
    intro:
      "This screen controls everything shown on the public site's homepage. It has two blocks: “Homepage sections” (the order and visibility of the eight main sections: hero, best sellers, by need, pharmacist quote, brands, expertise, routine, promo banners) and “Promo banners” (the promotional cards you create yourself, in three formats). A “Preview” button shows the real homepage in a scaled-down frame, exactly as customers see it. Any change made here is visible to every visitor of the site.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 6, kind: "text", label: "Admin / Operations / Homepage" },
            { w: 3, kind: "button", label: "Preview", hotspot: 1 },
            { w: 3, kind: "button", label: "+ Create banner", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Preview — homepage (scaled-down site in a frame, arrow to refresh)", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 9, kind: "panel", label: "Homepage sections: no. · name · Visible/Hidden · eye · ↑↓ arrows", hotspot: 4 },
            { w: 3, kind: "button", label: "Save order", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Promo banners: thumbnail · title · Online/Offline badge · ↑↓ · eye · pencil · trash", hotspot: 6 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Banner drawer: type (editorial/hero/quote) · Visible on the site · content · image and link · type guide", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "“Preview” button",
        desc: "Shows or hides the preview frame at the top of the screen. It is the real homepage (French version) in miniature: what you see is what customers see.",
      },
      {
        n: 2,
        label: "“Create banner” button",
        desc: "Opens the banner creation drawer on the right. Nothing is saved until you click “Create banner” at the bottom of the drawer.",
      },
      {
        n: 3,
        label: "Preview frame",
        desc: "Shows the saved version of the homepage. After saving, wait a few moments then click the small arrow at the top right of the frame to reload it. If no banner is online, a message says so under the frame.",
      },
      {
        n: 4,
        label: "“Homepage sections” panel",
        desc: "The eight homepage sections, in their display order. The eye shows or hides a section, the arrows move it up or down. A hidden section appears greyed out with the “Hidden” label. Sections cannot be deleted.",
      },
      {
        n: 5,
        label: "“Save order” button",
        desc: "Important: in this panel, the arrows and the eye only prepare the change. Nothing is applied until you click this button (it stays greyed out if there is nothing to save).",
      },
      {
        n: 6,
        label: "Promo banner list",
        desc: "One row per banner: thumbnail, title (clickable to edit), “Online” or “Offline” badge, then the buttons: arrows for the order, eye to activate/deactivate, pencil to edit, trash to delete. Unlike the panel above, these buttons save immediately, with no order confirmation button.",
      },
      {
        n: 7,
        label: "Banner creation / editing drawer",
        desc: "From top to bottom: the type choice (editorial, hero or quote), the “Visible on the site” switch, the Content block (title, description or quote, and for editorial the image side, for quote the signature: name, title, photo), the Image and link block (image + button destination and text), and at the very bottom the “Type guide” with three diagrams showing where each field goes.",
      },
    ],
    workflows: [
      {
        title: "Put a promo banner online",
        steps: [
          {
            title: "Create the banner",
            body: "Click “Create banner” and choose the type: editorial (image + text side by side), hero (large full-screen image with text on top) or quote (a quote on a dark background, with a signature).",
          },
          {
            title: "Fill in the content",
            body: "The title is always required. So are the image and the description, except for the quote type (there the description becomes the quote; the main image is not displayed for this type, no need to upload one — only the signature photo appears). The guide at the bottom of the drawer shows where each field will appear.",
          },
          {
            title: "Add the button (optional)",
            body: "“CTA destination” is the address the button sends the customer to (for example a catalogue page), “CTA label” is the button text. Without these fields, the banner shows without a button.",
          },
          {
            title: "Save",
            body: "Leave “Visible on the site” enabled and click “Create banner”. It appears at the bottom of the list with the “Online” badge.",
          },
          {
            title: "Check the section is enabled",
            body: "In the “Homepage sections” panel, the “Promo banners” row must be marked “Visible”. Otherwise no banner appears on the site, even when “Online”.",
          },
          {
            title: "Check on the site",
            body: "Open the preview (or the public homepage): the banner appears within a minute. Click the frame's refresh arrow if needed.",
          },
        ],
      },
      {
        title: "Reorder or hide a homepage section",
        steps: [
          {
            title: "Move or hide",
            body: "In “Homepage sections”, use the arrows to change the order and the eye to hide or show a section again. Hidden rows turn grey.",
          },
          {
            title: "Save the order",
            body: "Click “Save order”. Until you do, nothing is applied — if you leave the page first, your changes are lost.",
          },
          {
            title: "Check",
            body: "The public site picks up the new layout immediately: reload the public homepage (or the preview) to check the result in all three languages.",
          },
        ],
      },
      {
        title: "Temporarily switch off a banner",
        steps: [
          {
            title: "Click the eye",
            body: "In the banner list, click the eye on the relevant row. The badge switches to “Offline” immediately, with no confirmation step.",
          },
          {
            title: "Check on the site",
            body: "The banner disappears from the public homepage within a minute. The banner and all its content stay saved.",
          },
          {
            title: "Bring it back later",
            body: "Click the eye again: the badge goes back to “Online” and the banner returns to the site, in the same place in the order.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Save the section order",
        where: "“Homepage sections” panel: arrows + eye, then the “Save order” button",
        does: "Applies the new order and visibility of the eight homepage sections. The arrows and the eye alone only prepare the change: only this button saves.",
        effects: [
          "The order and visibility are saved to the database.",
          "The public homepage is regenerated immediately in all three languages: visitors see the new layout from their next page load.",
          "A hidden section disappears completely from the homepage (it is not deleted: its content comes back as soon as it is shown again).",
          "Hiding the “Promo banners” section hides all banners at once, even those marked “Online”.",
        ],
        severity: "caution",
        undo: "Set the order and visibility back the way you want, then click “Save order” again: the effect is immediate and nothing is ever lost.",
        audited: true,
        publicImpact: "The homepage layout changes for all visitors, immediately.",
      },
      {
        label: "Create a banner",
        where: "“Create banner” button at the top, then “Create banner” at the bottom of the drawer",
        does: "Saves a new promotional card (editorial, hero or quote type) with its title, text, image, optional button and visible/hidden state.",
        effects: [
          "The banner is saved to the database and added at the end of the list.",
          "If “Visible on the site” is enabled AND the “Promo banners” section is marked “Visible”, it appears on the public homepage within a minute.",
          "For the editorial and hero types, saving is refused if the image or the description is missing (a message says so). For the quote type, only the title and the quote matter: the main image is not displayed on the site for this type (only the signature photo appears).",
        ],
        severity: "caution",
        undo: "Click the row's eye to set it “Offline”, or delete it with the trash.",
        audited: true,
        publicImpact: "A new card appears on the homepage for all visitors, within a minute.",
      },
      {
        label: "Edit a banner",
        where: "Pencil at the end of the row (or click the title), then “Save” at the bottom of the drawer",
        does: "Replaces the banner's content with what is shown in the drawer: type, title, texts, image, button, visible/hidden state.",
        effects: [
          "The new content is saved and replaces the old one.",
          "The public homepage reflects the change within a minute.",
          "Changing the type (for example editorial → quote) completely changes the card's layout on the site.",
        ],
        severity: "caution",
        undo: "Reopen the banner and re-enter the previous values (note them down before editing: they are not kept anywhere else).",
        audited: true,
        publicImpact: "The card changes appearance on the homepage within a minute.",
      },
      {
        label: "Activate / deactivate a banner (eye)",
        where: "Eye on the banner's row, in the “Promo banners” list",
        does: "Switches the banner between “Online” and “Offline”. Saving is immediate: no confirmation window and no button to click afterwards.",
        effects: [
          "The row's badge changes immediately.",
          "The banner appears on or disappears from the public homepage within a minute (provided the “Promo banners” section is visible).",
          "All the banner's content is kept: it is a simple switch.",
        ],
        severity: "caution",
        undo: "Click the eye again: the banner comes back exactly as before.",
        audited: true,
        publicImpact: "Shows or removes the card from the homepage for all visitors.",
      },
      {
        label: "Move a banner up / down (arrows)",
        where: "↑↓ arrows on the banner's row, in the “Promo banners” list",
        does: "Swaps the banner's position with its neighbour. Saving is immediate, with no confirmation.",
        effects: [
          "The list order changes right away in the admin.",
          "On the public homepage, banners show in that same order; the change is visible within a minute.",
        ],
        severity: "caution",
        undo: "Click the opposite arrow to go back to the previous order.",
        audited: true,
        publicImpact: "The order of the cards changes on the homepage.",
      },
      {
        label: "Delete a banner",
        where: "Trash at the end of the row, then “Yes, delete” in the confirmation window",
        does: "Permanently erases the banner from the database: title, texts, settings. A confirmation window shows first.",
        effects: [
          "The banner disappears from the list and cannot be restored: to bring it back you will have to recreate it entirely (the image itself stays in storage, but everything else is lost).",
          "It disappears from the public homepage within a minute.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "The card disappears from the homepage for all visitors.",
      },
    ],
    gotchas: [
      "Two saving logics coexist: the “Homepage sections” panel applies nothing until you click “Save order”, while the arrows and the eye in the banner list save immediately, with no confirmation.",
      "An “Online” banner stays invisible if the “Promo banners” section is hidden in the panel above. Always check both.",
      "The new section order is applied to the site immediately; banner changes can take up to a minute to show. If you see nothing, wait a moment and reload.",
      "The preview shows the saved version (in French): it never shows a drawer being filled in. Save first, then click the frame's refresh arrow.",
      "The eight homepage sections cannot be deleted, only hidden or moved. Avoid hiding “Hero”: it is the very first screen customers see.",
      "The “Pharmacist quote” section only shows something if at least one catalogue product has a pharmacist tip filled in; otherwise it stays empty even when marked “Visible”.",
      "For the quote type, the “Description” field becomes the quote itself and the signature (name, title, photo) shows below it; there is no button on this type. The image side (left/right) only applies to the editorial type.",
      "Deleting a banner is permanent: prefer the eye (“Offline”) if you think you may reuse it later.",
    ],
  },
  {
    id: "blog",
    navLabel: "Blog",
    title: "Blog — write, publish and remove articles",
    route: "/admin/blog",
    intro:
      "This screen manages the public site's blog articles: tips, pharmacy news, skincare features. An article is written in a single language (French, Spanish or English), with a title, a page address, content formatted in a visual editor, an excerpt, a cover image and an author. As long as the “Published” box is unticked, the article is a draft invisible to customers. Once published, it appears on the site within a minute.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 8, kind: "text", label: "N articles" },
            { w: 4, kind: "button", label: "New article", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "List: title · Published/Draft badge · language · /page-address · date", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "panel", label: "“Edit” buttons", hotspot: 3 },
            { w: 6, kind: "panel", label: "“Delete” — immediate, no confirmation", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Article window: title · address · language · author · excerpt · text editor · cover · Published box", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "“New article” button",
        desc: "Opens the empty writing window. Nothing is saved until you click “Save” at the bottom.",
      },
      {
        n: 2,
        label: "Article list",
        desc: "One row per article, newest first: the title (clickable to edit), the “Published” (green) or “Draft” (grey) badge, the language tag (FR/ES/EN), the page address and the publication date.",
      },
      {
        n: 3,
        label: "“Edit” button",
        desc: "Opens the writing window pre-filled with the article's current content (clicking the title does the same).",
      },
      {
        n: 4,
        label: "“Delete” button",
        desc: "Careful: deletion happens immediately on click, with no confirmation window. The article is erased permanently.",
      },
      {
        n: 5,
        label: "Writing window",
        desc: "From top to bottom: Title (when creating, it automatically fills in the page address); page address; Language and Author; Excerpt (the summary shown on the blog list); Content (visual editor: bold, italic, headings, lists, quote, link, image, undo/redo); Cover image (uploaded from your computer); and the “Published” box.",
      },
    ],
    workflows: [
      {
        title: "Write and publish an article",
        steps: [
          {
            title: "Create the draft",
            body: "Click “New article” and type the title: the page address fills in by itself. Choose the writing language and the author.",
          },
          {
            title: "Write the content",
            body: "Write in the visual editor: the toolbar offers bold, italic, two heading levels, lists, quotes, links and image insertion. No technical knowledge needed.",
          },
          {
            title: "Polish the excerpt and the cover",
            body: "The excerpt is the short summary shown on the blog page; the cover image illustrates the thumbnail and the top of the article. Both are optional but recommended.",
          },
          {
            title: "Publish",
            body: "Tick “Published” then click “Save”. The publication date is set at that moment.",
          },
          {
            title: "Check on the site",
            body: "The article appears on the public site's Blog page within a minute, with a small tag showing its language.",
          },
        ],
      },
      {
        title: "Fix an already published article",
        steps: [
          {
            title: "Open the article",
            body: "Click its title or the “Edit” button: the window opens pre-filled.",
          },
          {
            title: "Make the fix",
            body: "Edit the text, the image or the excerpt. Avoid touching the page address: changing it would break links already shared (the old address would lead to a page not found).",
          },
          {
            title: "Save",
            body: "The corrected version replaces the old one on the site within a minute. The original publication date is kept.",
          },
        ],
      },
      {
        title: "Remove an article from the site without deleting it",
        steps: [
          {
            title: "Open the article",
            body: "Click “Edit” on the published article's row.",
          },
          {
            title: "Untick “Published”",
            body: "Untick the box at the bottom of the window, then “Save”. The badge goes back to “Draft”.",
          },
          {
            title: "Check",
            body: "The article disappears from the Blog page within a minute (its direct page becomes not found). All its content stays saved in the admin.",
          },
          {
            title: "Republish it later",
            body: "Tick “Published” again and save: the article returns to the site with its original publication date, which does not change.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Create an article",
        where: "“New article” button, then “Save” at the bottom of the window",
        does: "Saves a new article with its title, page address, language, content, excerpt, cover, author and published-or-draft state.",
        effects: [
          "The article is saved to the database and appears at the top of the list.",
          "Draft (box unticked): invisible to customers, you can come back to it whenever you want.",
          "Published (box ticked): the publication date is set and the article appears on the site's Blog page within a minute.",
          "The title and the page address are required. If the address is already used by another article, saving is refused with a message.",
        ],
        severity: "caution",
        undo: "Untick “Published” to remove it from the site, or delete the article.",
        audited: true,
        publicImpact: "If published, the article appears on the site's Blog page within a minute, in every version of the site.",
      },
      {
        label: "Edit an article",
        where: "Article title or “Edit” button, then “Save”",
        does: "Replaces the article's content with what is shown in the window (title, address, language, text, excerpt, cover, author, published state).",
        effects: [
          "The new version replaces the old one — the old text is not kept.",
          "If the article is published, the corrected version is served to visitors within a minute.",
          "Changing the page address makes the old address not found: links already shared will no longer work.",
          "The original publication date does not move, even after several edits.",
        ],
        severity: "caution",
        undo: "Reopen the article and re-enter the previous text (it is not kept anywhere else: copy it before a big rewrite).",
        audited: true,
        publicImpact: "Visitors see the new version of the article within a minute.",
      },
      {
        label: "Publish / unpublish (“Published” box)",
        where: "“Published” box at the bottom of the writing window, then “Save”",
        does: "Puts the article online or removes it from the site, without touching its content. It is the article's main switch.",
        effects: [
          "Ticked: the article appears on the Blog page within a minute. On the very first publication, the publication date is set; it will never change again, even after removing then republishing.",
          "Unticked: the article disappears from the site within a minute (its page becomes not found), but everything is kept in the admin with the “Draft” badge.",
        ],
        severity: "caution",
        undo: "Tick (or untick) the box and save again: nothing is ever lost.",
        audited: true,
        publicImpact: "Makes the article appear on or disappear from the public site, within a minute.",
      },
      {
        label: "Delete an article",
        where: "“Delete” button at the end of the row",
        does: "Permanently erases the article from the database. Careful: deletion happens immediately on click, there is NO confirmation window.",
        effects: [
          "The article disappears from the list and cannot be restored: the title, text and excerpt are lost (images already uploaded stay in storage, but you will have to rewrite everything).",
          "If it was published, it disappears from the site within a minute and its address becomes not found.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "The article disappears from the Blog page and its address leads to a page not found.",
      },
    ],
    flows: [
      {
        title: "Life of an article",
        lanes: [
          [
            {
              label: "Draft",
              tone: "neutral",
              note: "Visible only in the admin. You can rework it as much as needed.",
            },
            {
              label: "Published",
              tone: "ok",
              note: "Online on the Blog page within a minute. The publication date is set on first publication and never changes.",
            },
            {
              label: "Removed (back to draft)",
              tone: "warn",
              note: "“Published” box unticked: the article leaves the site but stays saved in the admin. Tick it again to republish.",
            },
          ],
          [
            {
              label: "Deleted",
              tone: "bad",
              note: "Erased permanently, with no prior confirmation. Impossible to restore.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "“Delete” erases the article immediately, with NO confirmation window. If in doubt, untick “Published” instead: the article leaves the site but stays recoverable.",
      "The page address fills in automatically from the title only at creation; when editing, it no longer follows the title. Changing it on a published article breaks links already shared.",
      "Two articles cannot have the same page address: saving is refused with a message saying an article with this slug already exists.",
      "The article is not translated automatically: it shows as written. The site's Blog page shows all published articles whatever language the visitor chose, with a small tag (FR/ES/EN) showing the writing language.",
      "The publication date is frozen at first publication: unpublishing then republishing does not refresh it.",
      "Allow up to a minute before seeing a change (publication, fix, removal) on the public site. If nothing moves, wait a moment and reload the page.",
      "The content is written in a visual editor (bold, headings, lists, links, images): there is no need — and no way — to paste code into it.",
    ],
  },
]
