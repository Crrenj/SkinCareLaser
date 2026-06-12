import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "settings",
    navLabel: "Shop settings",
    title: "Shop & reservations — contact details and pickup point",
    route: "/admin/settings",
    intro:
      "This screen gathers the shop's official information: the name and tagline (saved, but with no visible effect on the site for now), the contact details (email, phone, WhatsApp number) and the pickup point for reservations (name, address, hours, phone). These values feed the footer, the Contact page, the Pharmacy page, the About page, the confirmation page, the confirmation email sent to the customer and the pre-filled WhatsApp links. Important: the shop works with free pharmacy pickup only — there is no paid delivery, so there are no delivery rates to set here.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Admin / Settings / Shop & reservations" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Shop identity: name (required) · tagline", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Contact & WhatsApp: email · phone · WhatsApp number", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "Reservation & pickup: how-it-works reminder (3 steps · 24h hold)", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "Pickup point: name · full address · hours · pharmacy phone", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Unsaved changes", hotspot: 5 },
            { w: 3, kind: "button", label: "Cancel" },
            { w: 3, kind: "button", label: "Save", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "“Shop identity” card",
        desc: "The shop name (required, cannot be empty) and the tagline. Note: both fields are saved, but the public site currently displays a fixed name and logo — changing them has no visible effect for customers for now.",
      },
      {
        n: 2,
        label: "“Contact & WhatsApp” card",
        desc: "The email and phone shown on the Contact and Pharmacy pages and used as a fallback on the confirmation page. The WhatsApp number is used to build the “Confirm my reservation on WhatsApp” buttons given to customers: enter it in international format (for example +18094122468).",
      },
      {
        n: 3,
        label: "“Reservation & pickup” panel",
        desc: "A simple reminder of how it works: the customer reserves online, you follow up on WhatsApp, they pick up and pay at the pharmacy. The 24h hold on reservations is also mentioned there. Nothing in this panel can be changed: it is information, not a setting.",
      },
      {
        n: 4,
        label: "“Pickup point” fields",
        desc: "The name, full address, hours and phone of the pharmacy where the customer picks up their reservation. This information appears on the About page, in the pre-filled WhatsApp message on the confirmation page and in the confirmation email sent to the customer. Note: the address and hours shown in the reservation flow and on the Pharmacy page are still fixed — these fields do not change them.",
      },
      {
        n: 5,
        label: "Save bar",
        desc: "This dark bar only appears once at least one field has been changed. While it is visible, nothing is saved yet: if you leave the page without clicking “Save”, your changes are lost.",
      },
      {
        n: 6,
        label: "“Save” button",
        desc: "Saves all the fields on the screen at once. The shop name must be filled in and the contact email must be a valid address, otherwise an error message appears and nothing is saved.",
      },
    ],
    workflows: [
      {
        title: "Update the contact details",
        steps: [
          {
            title: "Edit the fields",
            body: "In the “Contact & WhatsApp” card, fix the email, the phone or the WhatsApp number. The dark “Unsaved changes” bar appears at the bottom.",
          },
          {
            title: "Save",
            body: "Click “Save” in the bottom bar. A “Settings saved” message confirms the operation.",
          },
          {
            title: "Check the site",
            body: "Open the Contact page and the Pharmacy page on the public site: the new details appear within a few minutes at most. The footer and the WhatsApp buttons follow too.",
          },
        ],
      },
      {
        title: "Change the pickup point information",
        steps: [
          {
            title: "Edit the pickup point",
            body: "In the “Reservation & pickup” card, below the how-it-works reminder, fix the pharmacy's name, address, hours or phone.",
          },
          {
            title: "Save",
            body: "Click “Save” in the bottom bar.",
          },
          {
            title: "Check the customer journey",
            body: "The new information appears on the About page, in the WhatsApp message on the confirmation page and in upcoming confirmation emails. However, the address shown in the reservation flow and on the Pharmacy page does not follow these fields: it is still fixed. Reservations already placed are not changed.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Save",
        where: "Dark bar at the bottom of the screen (it only appears if a field has been changed)",
        does: "Saves the screen's ten fields at once: name, tagline, email, phone, WhatsApp number, the four pickup point details and the low-stock threshold.",
        effects: [
          "All values are saved together in the database (there is only one shop record).",
          "The public site picks up the new values within a few minutes at most: footer, Contact page, Pharmacy page, About page, confirmation page.",
          "Upcoming reservation confirmation emails and the WhatsApp buttons given to customers use the new details.",
          "Saving is refused with a message if the shop name is empty, if the contact email is not a valid address, or if a field exceeds 400 characters.",
          "A cleared field (left empty) disappears from the public site: the corresponding line is no longer displayed.",
        ],
        severity: "caution",
        undo: "Re-enter the old values and save again. They are not kept anywhere else: write them down before a big change.",
        audited: true,
        publicImpact: "The contact details and the pickup point change for all site visitors, within a few minutes at most.",
      },
      {
        label: "Cancel",
        where: "Dark bar at the bottom of the screen, to the left of “Save”",
        does: "Discards the changes in progress and resets every field to its last saved value.",
        effects: [
          "The fields go back to the saved values; nothing is sent to the database.",
          "Only works before clicking “Save”: after saving, this button does not bring the old values back.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "The “Shop name” and “Tagline” are saved, but the public site currently displays a fixed name and logo: changing these two fields has no visible effect for customers for now.",
      "No delivery: the shop works with free pharmacy pickup only. This screen therefore contains no delivery rates. Old delivery amounts still exist in the database, but they are not used anywhere — ignore them.",
      "The “Reservation & pickup” panel (the three steps and the 24h hold) is just a reminder: nothing in it is adjustable. The 24h delay before a reservation expires automatically is fixed and cannot be changed here.",
      "The “Pickup point” fields do not change the whole site: the address and hours shown at the pickup step of the reservation flow and on the Pharmacy page are still hard-written. These fields do, however, feed the About page, the WhatsApp message and the confirmation email sent to the customer.",
      "Enter the WhatsApp number in international format with the country code (for example +18094122468). If it is empty, the “Confirm on WhatsApp” buttons send the customer to the Contact page instead, and the confirmation page offers the phone or email as a backup.",
      "A contact field left empty simply disappears from the site: without a contact email, the email line no longer appears on the Contact and Pharmacy pages.",
      "Nothing is saved while the dark “Unsaved changes” bar is visible: if you leave the page before clicking “Save”, everything is lost.",
      "The old values are not kept: the activity log records what was changed and by whom, but not the previous values. Write them down before an important change.",
      "Allow a few minutes before seeing the changes on the public site: pages refresh automatically, but not instantly.",
    ],
  },
  {
    id: "appearance",
    navLabel: "Appearance",
    title: "Site theme — color palette, light/dark mode, visitor switch",
    route: "/admin/apariencia",
    intro:
      "This screen picks the site's visual look: a color palette among six (Terra, Noir, Botánico, Coral, Marino, Ámbar), the public site's default mode (light, dark, or “System”, which follows the visitor's device setting), and whether visitors are allowed to switch between light and dark themselves via a button in the footer. The chosen palette applies to the public site AND the admin panel; the browser tab icon (the hummingbird) follows the theme too. All content (products, copy, photos) stays the same: only the colors change.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Admin / Personalization / Site theme" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "Terra ✓ (preview + 3 swatches)", hotspot: 1 },
            { w: 4, kind: "panel", label: "Noir" },
            { w: 4, kind: "panel", label: "Botánico" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "panel", label: "Coral" },
            { w: 4, kind: "panel", label: "Marino" },
            { w: 4, kind: "panel", label: "Ámbar" },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "tabs", label: "Default mode: Light · Dark · System", hotspot: 2 },
            { w: 6, kind: "tabs", label: "Visitor can switch: Yes · No", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Last change · date · the public site updates on next load" },
            { w: 3, kind: "button", label: "Cancel", hotspot: 4 },
            { w: 3, kind: "button", label: "Save theme", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Grid of the six palettes",
        desc: "Each card shows a preview (the theme background with the hummingbird), a strip of three color swatches, the palette's name and its tones. Click a card to select it: a check mark and a colored border mark your choice. Nothing changes until you save.",
      },
      {
        n: 2,
        label: "“Default mode”",
        desc: "The mode the public site displays in for visitors: Light, Dark, or System (the site then follows each visitor's device light/dark setting). This setting does not affect the admin panel, which has its own toggle at the top of every page.",
      },
      {
        n: 3,
        label: "“Visitor can switch”",
        desc: "On “Yes”, a sun/moon button appears in the public site footer: each visitor can switch between light and dark, and their choice is remembered on their device. On “No”, the button disappears and choices visitors have already made are ignored: everyone sees the default mode.",
      },
      {
        n: 4,
        label: "“Cancel” button",
        desc: "Resets the selection (palette, mode, visitor switch) to how it was at the last save. Greyed out if there is nothing to cancel. No effect once the save is done.",
      },
      {
        n: 5,
        label: "“Save theme” button",
        desc: "Applies your choices. The admin panel and the tab icon change immediately, without reloading the page; the public site picks up the new palette on each visitor's next page load.",
      },
    ],
    workflows: [
      {
        title: "Change the site's color palette",
        steps: [
          {
            title: "Pick a card",
            body: "Click the palette you want in the grid: the check mark and the border confirm the selection. Each card's swatches give an idea of the tones (light background, dark background, accent color).",
          },
          {
            title: "Save",
            body: "Click “Save theme”. A “Theme saved” message confirms. The admin panel takes the new colors immediately — that is normal, no need to reload.",
          },
          {
            title: "Check the public site",
            body: "Open or reload a page on the public site: the new palette shows. The browser tab icon (the hummingbird) has changed colors too.",
          },
          {
            title: "Roll back if needed",
            body: "Not convinced? Re-select the old palette and save again: everything goes back exactly as it was, nothing is lost.",
          },
        ],
      },
      {
        title: "Switch the public site to dark mode by default",
        steps: [
          {
            title: "Choose “Dark”",
            body: "Under “Default mode”, click “Dark”. Choose “System” if you prefer the site to follow each visitor's device setting.",
          },
          {
            title: "Decide on the visitor switch",
            body: "With “Visitor can switch: Yes”, a visitor who prefers light can go back to light via the footer button. On “No”, everyone stays in dark.",
          },
          {
            title: "Save and check",
            body: "Click “Save theme”, then browse a few public site pages in dark: dark mode is recent, make sure everything looks readable to you.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Save theme",
        where: "At the bottom of the screen, on the right (greyed out until something has been changed)",
        does: "Saves the chosen palette, the default mode and the visitor switch permission together, then applies them all.",
        effects: [
          "The three settings are saved in the database (the same shop record as the settings).",
          "The admin panel takes the new colors immediately, without reloading the page.",
          "The browser tab icon (the hummingbird) switches to the new theme's colors, right away.",
          "The public site displays the new palette on each visitor's next page load.",
          "If the visitor switch goes to “No”, the sun/moon button disappears from the footer and the light/dark preferences visitors have already saved are ignored.",
        ],
        severity: "caution",
        undo: "Re-select the old palette and the old settings, then save again: the rollback is exact, nothing is ever lost.",
        audited: true,
        publicImpact: "All the site's colors change for all visitors (content, prices and photos stay the same).",
      },
      {
        label: "Cancel",
        where: "At the bottom of the screen, to the left of “Save theme”",
        does: "Discards the current selection and goes back to the settings from the last save.",
        effects: [
          "The selected card, the default mode and the visitor switch go back to their saved state; nothing is sent to the database.",
          "No effect once “Save theme” has been clicked: you then have to re-select the old theme and save again.",
        ],
        severity: "safe",
      },
    ],
    gotchas: [
      "Clicking a theme card changes nothing by itself: the selection is only applied when you click “Save theme”. The cards show color swatches, not a live preview of the pages.",
      "The palette applies to the public site AND the admin panel. The “Default mode” (light/dark), however, only affects the public site: the admin panel has its own light/dark toggle at the top of every page, personal to each team member.",
      "“Visitor can switch: No” does two things: the sun/moon button disappears from the footer, and the light/dark preferences visitors have already chosen are ignored — everyone sees the default mode again.",
      "After saving, the admin panel and the tab icon change immediately; the public site, on the other hand, picks up the new palette on the next page load (the text at the bottom of the screen reminds you of this).",
      "Dark mode is recent: a few decorative bands on the site may look inverted in dark (readable, but different). Browse the public site after enabling it to check that you are happy with the result.",
      "Changing the theme touches neither products, nor prices, nor copy, nor photos: only the colors. It is fully reversible — Terra is the shop's original palette.",
    ],
  },
]
