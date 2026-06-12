import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "admins",
    navLabel: "Administrators",
    title: "Administrators — manage the team with access to the panel",
    route: "/admin/admins",
    intro:
      "This page lists the pharmacy's admin team. There are two roles: “Admin” can do everything in the panel (products, stock, reservations, accounting…) except manage the team; “Super admin” can also add or remove members and change their role. Important: an administrator is not a separate account — it's a normal customer account on the site with extra rights added. They keep their whole customer side (cart, reservations, favourites, profile); nothing is taken away. Any team member can view this page and edit display names (the pencil); however, only super admins see the management buttons and the “Add an administrator” area. If you're a regular admin, a notice reminds you: “Only a super admin can manage the team.”",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Administrators — title and breadcrumb Admin" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Team members", hotspot: 1 },
            { w: 4, kind: "kpi", label: "Super admins" },
            { w: 4, kind: "kpi", label: "Admins" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Admin team — Member · Role · Member since · Actions", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "button", label: "✏ Pencil (display name)", hotspot: 3 },
            { w: 4, kind: "button", label: "Super admin", hotspot: 4 },
            { w: 4, kind: "button", label: "Revoke", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "input", label: "🔍 Add an administrator — search email, name…", hotspot: 6 },
            { w: 4, kind: "button", label: "Search" },
          ],
        },
        {
          blocks: [
            { w: 8, kind: "panel", label: "Results: accounts found" },
            { w: 4, kind: "button", label: "Make admin", hotspot: 7 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Number tiles",
        desc: "Three counters: the team size, the number of super admins and the number of regular admins. They cover the whole team (the list is not paginated).",
      },
      {
        n: 2,
        label: "Team table",
        desc: "One row per member, from oldest to newest. You see the display name (failing that, the first and last name from the profile — a dash only if the profile is empty), the email below it, the role as a badge, and the date they joined the team. Your own row carries the “You” badge. Super admin rows show a “Protected” padlock instead of the management buttons: nobody can touch their access from the panel (their display name, though, can still be edited with the pencil).",
      },
      {
        n: 3,
        label: "Pencil — edit the display name",
        desc: "Present on every row, for all admins. The display name is the name a team member appears under everywhere in the panel (lists, activity log…). The check mark saves, the cross cancels. Every change is recorded in the activity log.",
      },
      {
        n: 4,
        label: "Super admin button",
        desc: "Visible only to super admins, on regular admin rows. Promotes the member to super admin after a confirmation window. Careful: once promoted, they become “Protected” — nobody will be able to demote or revoke them from the panel anymore.",
      },
      {
        n: 5,
        label: "Revoke button",
        desc: "Visible only to super admins, on regular admin rows. Removes panel access after a confirmation window. The person's customer account stays intact.",
      },
      {
        n: 6,
        label: "Add an administrator",
        desc: "Area visible only to super admins. Type at least two characters (email, first name, last name, display name or phone) then run the search: it finds an account already registered on the site. It only goes through the first 50 accounts — if the person doesn't show up, go through the “Customers” page and its “Next” buttons.",
      },
      {
        n: 7,
        label: "Make admin",
        desc: "On every search result that isn't already an admin. Immediately grants panel access with the “Admin” role. Accounts that are already members show “Already admin” instead.",
      },
    ],
    workflows: [
      {
        title: "Give panel access to a new employee",
        steps: [
          {
            title: "Have them create a normal account",
            body: "The employee signs up on the public site like any customer. There is no separate “admin” account: rights are added to an existing account.",
          },
          {
            title: "Find their account",
            body: "Logged in as a super admin, type their email or name in the “Add an administrator” area at the bottom of the page, then run the search.",
          },
          {
            title: "Make them admin",
            body: "Click “Make admin” on their row. Access is immediate and the person appears in the team table right away.",
          },
          {
            title: "Set their display name",
            body: "Click the pencil on their new row and type the name the team will see them under throughout the panel (their first name, for example).",
          },
        ],
      },
      {
        title: "Remove access from a member leaving the team",
        steps: [
          {
            title: "Find their row",
            body: "In the “Admin team” table, locate the member by their display name or email.",
          },
          {
            title: "Revoke",
            body: "Click “Revoke” then confirm. From their next page load, the panel is closed to them.",
          },
          {
            title: "Check",
            body: "The person disappears from the table. Their customer account keeps working normally (login, reservations, history), and their past actions remain visible in the activity log.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Pencil (edit the display name)",
        where: "On every row of the “Admin team” table, next to the name — visible to all admins",
        does: "Changes a team member's display name, i.e. the name they appear under throughout the panel.",
        effects: [
          "The new display name shows up immediately here, and everywhere team members are named (Customers page, activity log…).",
          "Any admin can rename any member, including themselves and the super admins — it's just a display label, not a privilege.",
          "The display name is limited to 60 characters and cannot be empty.",
          "It touches neither their email, nor their password, nor their first and last name. It does, however, match the “Display name” field of the profile: the person also sees it in their personal area on the site, and can change it there themselves.",
          "The change is recorded in the activity log, with the new display name and the author of the change.",
        ],
        severity: "safe",
        undo: "Click the pencil again and type the old display name back in.",
        audited: true,
      },
      {
        label: "Make admin",
        where: "In the results of the “Add an administrator” area — visible only if you are a super admin",
        does: "Grants an account already registered on the site full access to the panel, with the “Admin” role.",
        effects: [
          "The person immediately gets access to the whole panel: products, prices, stock, reservations, sales, customers and the accounting (including purchase costs and margins).",
          "They keep their whole customer account: cart, reservations, favourites, profile — nothing is lost.",
          "They appear in the team table and their name now follows the member rule: display name first.",
          "They can NOT manage the team: that right stays reserved for super admins.",
          "No message is sent to the person: tell them yourself.",
          "The operation is recorded in the activity log.",
        ],
        severity: "caution",
        undo: "Click “Revoke” on their row in the team table — everything goes back to how it was.",
        audited: true,
      },
      {
        label: "Super admin (promote)",
        where: "At the end of a regular admin's row, in the team table — visible only if you are a super admin",
        does: "Gives an admin the power to manage the team: add members, revoke access, promote other super admins.",
        effects: [
          "A confirmation window shows the email concerned and warns: “They'll be able to manage the admin team.” Nothing happens if you cancel.",
          "The member immediately becomes a super admin and their row switches to “Protected”: the management buttons disappear (only the display-name pencil remains).",
          "From then on, NOBODY can demote or revoke them from the panel — not even you, not even another super admin. The only way back is through the technician, directly in the database.",
          "This is a deliberate safeguard: it prevents one super admin from ousting the others, or the team from ending up with nobody in charge.",
          "The operation is recorded in the activity log.",
        ],
        severity: "danger",
        audited: true,
      },
      {
        label: "Revoke",
        where: "At the end of a regular admin's row, in the team table — visible only if you are a super admin",
        does: "Removes this member's access to the admin panel.",
        effects: [
          "A confirmation window shows the email concerned; nothing happens if you cancel.",
          "From their next page load, the person can no longer open the panel and disappears from the team table.",
          "Their customer account stays intact: they can still log in to the site, reserve, and view their history.",
          "Impossible on yourself and on a super admin: the site blocks both cases, no matter how hard you try.",
          "Their past actions remain in the activity log, under their name.",
          "The operation is recorded in the activity log.",
        ],
        severity: "safe",
        undo: "Search for their account in “Add an administrator” and click “Make admin” to give the access back.",
        audited: true,
      },
    ],
    flows: [
      {
        title: "A team member's journey",
        lanes: [
          [
            {
              label: "Registered customer",
              note: "A normal site account, created by the person themselves. It's the mandatory starting point.",
            },
            {
              label: "Admin",
              tone: "ok",
              note: "Access to the whole panel, except team management. Keeps their customer account. Reversible at any time by a super admin.",
            },
            {
              label: "Super admin",
              tone: "warn",
              note: "Also manages the team. Becomes “Protected”: no way back from the panel, only through the technician.",
            },
          ],
          [
            {
              label: "Revoked admin",
              tone: "neutral",
              note: "Becomes a plain site customer again. Nothing is lost on the customer side, and their past actions stay in the activity log.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "You can never change your own access (promote, demote or revoke yourself): the site blocks it, so a team can't accidentally end up without anyone in charge.",
      "A super admin is untouchable from the panel: no demotion, no revocation, not by you, not by another super admin. Think before promoting — going back requires the technician to step into the database.",
      "The display-name pencil is open to ALL admins, on every row (including the super admins and yourself). Every rename made from this page is recorded in the activity log, with its author. But a member can also change their own display name from their personal area on the site — that change does not show up in the log.",
      "The display name changes neither the email, nor the password, nor the first and last name. It's the “Display name” field of the profile, which the person also manages themselves in their personal area on the site: if you change it here, they will see it changed there (and vice versa).",
      "The “Add an administrator” search only goes through the site's first 50 accounts. If the person doesn't show up, go through the “Customers” page: search there works page by page and the “Make admin” button does the same thing.",
      "“Make admin” always grants the standard “Admin” role. To hand over team management, you then need to click “Super admin” on their row.",
      "Nobody is notified automatically of a promotion or a revocation: no message is sent. Tell the person yourself.",
      "Granting admin access means granting access to the full accounting: purchase costs, margins, revenue. Reserve it for people you trust.",
      "The “Member since” dates are shown in Spanish format, whatever the panel language.",
    ],
  },
  {
    id: "logs",
    navLabel: "Activity log",
    title: "Activity log — who did what, and when",
    route: "/admin/logs",
    intro:
      "The activity log automatically records the creations, changes and deletions made from the admin panel: products, prices, stock, receptions, losses, reservations, sales, expenses, promotions, shop settings, appearance, homepage, blog posts, banners, review moderation, messages, customer accounts created from the panel, newsletter subscriber deletions, tags, brands, ranges, uploaded images, and every admin access change. Each row says who acted, when, on what, with a short summary. It's a team-transparency tool: when in doubt (“who changed this price?”), the answer is here. This page is read-only: you look things up, you change nothing — and no row can be erased from the panel. Conversely, simply viewing things is never recorded: opening a page, looking at a reservation or the accounting leaves no trace. Customer actions on the public site (reserving, writing a review, subscribing to the newsletter) don't appear either: the log covers what is done in the panel.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Activity log — title and breadcrumb Admin" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "toolbar", label: "Entity · Action · Author", hotspot: 1 },
            { w: 4, kind: "toolbar", label: "From · To (dates)", hotspot: 2 },
            { w: 3, kind: "toolbar", label: "☑ High impact only", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "When · Author · Action · Entity · Summary", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "panel", label: "› Expanded row: detail of the changed fields", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 6, kind: "text", label: "Page 1" },
            { w: 6, kind: "toolbar", label: "Previous · Next", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Entity, Action, Author filters",
        desc: "Three drop-down menus. “Entity” = the type of item touched (Producto, Reserva, Stock, Gasto… — the labels are in Spanish). “Action” = Create, Update or Delete. “Author” offers the current members of the admin team. Each choice reloads the list and goes back to page 1.",
      },
      {
        n: 2,
        label: "“From” / “To” date filters",
        desc: "Bound the period shown. Careful: days are counted in universal time, not local time — an action done in the evening can end up filed under the next day. If in any doubt, widen the period by one day on each side.",
      },
      {
        n: 3,
        label: "“High impact only” checkbox",
        desc: "Keeps only the sensitive operations: everything that touches money, stock, prices, admin access and the shop configuration. The rows concerned also carry a small orange shield in the Entity column. A “Reset” link appears as soon as any filter is active.",
      },
      {
        n: 4,
        label: "Log table",
        desc: "Newest first, 50 rows per page. Each row: the date and time, the author (their display name, with the email below), an action badge (Create in green, Update in grey, Delete in red), the entity touched and a summary in Spanish. “System” as the author means the action has no identifiable author: an automatic site action, or an author whose account has since been deleted.",
      },
      {
        n: 5,
        label: "Chevron › — view the details",
        desc: "When a row carries a small arrow on the left, click it to expand the detail of the changed fields, shown in a raw technical format. Passwords and files never appear there, and very long texts are cut short.",
      },
      {
        n: 6,
        label: "Pagination",
        desc: "The list moves in pages of 50 rows. “Next” greys out when the current page isn't full — there is nothing more after it.",
      },
    ],
    workflows: [
      {
        title: "Find out who changed a product or a price",
        steps: [
          {
            title: "Filter by entity",
            body: "Choose “Producto” in the “Entity” menu (the menu labels are in Spanish).",
          },
          {
            title: "Narrow the period",
            body: "If you roughly know when the change happened, set the “From” and “To” dates to shorten the list.",
          },
          {
            title: "Read the summary",
            body: "Each row names the product touched and the author. The badge says whether it's a creation, an update or a deletion.",
          },
          {
            title: "Expand if needed",
            body: "Click the small arrow on the left of the row to see exactly which fields were changed and their new values.",
          },
        ],
      },
      {
        title: "Do a weekly review of sensitive operations",
        steps: [
          {
            title: "Turn on “High impact only”",
            body: "The list keeps only what touches money, stock, prices, access and configuration.",
          },
          {
            title: "Set the period",
            body: "Fill in “From” and “To” with the past week.",
          },
          {
            title: "Browse by author",
            body: "If needed, filter by team member with the “Author” menu to follow each person's activity.",
          },
        ],
      },
    ],
    actions: [],
    gotchas: [
      "Viewing is never recorded: looking at a page, a reservation or the accounting leaves no trace. The log only shows creations, updates and deletions.",
      "Customer actions on the public site (reserving, writing a review, subscribing to the newsletter) don't appear here: the log covers actions done from the admin panel.",
      "Nothing on this page can be changed or erased, by anyone — and rows are not deleted automatically over time. That's the point: the log serves as a lasting memory.",
      "“System” as the author is not an anomaly: it's an action with no identifiable author — automatic, or whose author has since deleted their account (their old rows remain, but lose their name).",
      "The “Author” menu only offers the current admin team. A revoked member's rows still exist and still show their name, but to find them you need to go through the dates or the entity rather than that menu.",
      "Summaries and entity names are written in Spanish, whatever language is chosen for the panel.",
      "“High impact” is a label set automatically on the sensitive categories (money, stock, prices, access, configuration). It can cover harmless gestures within those categories — a simple admin display-name change is marked “high impact”, for example.",
      "The expanded detail never contains passwords or files, and customers' phone numbers are kept out of it. Very long texts are cut short.",
      "Log recording is designed to never block your work: in very rare failure cases, an action can be missing from the log even though it did happen.",
      "Any team member (admin or super admin) can view this log — including the rows about the others. That's intentional: transparency goes both ways.",
    ],
  },
]
