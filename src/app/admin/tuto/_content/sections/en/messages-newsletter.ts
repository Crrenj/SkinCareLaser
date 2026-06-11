import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "messages",
    navLabel: "Tickets",
    title: "Support tickets — messages from the contact form",
    route: "/admin/messages",
    intro:
      "When a visitor fills in the form on the site's Contact page or the help center form, their message lands here as a “ticket”. Each ticket contains the person's email address, a subject and the full message. It arrives with the “Open” status and “Normal” priority. This screen is for tracking these requests: spotting new ones, reading them, noting that someone is handling them, then marking them resolved or closed. Important: the panel sends no emails — to reply to the customer, you write from the pharmacy's mailbox, using the address shown on the ticket.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Support tickets — title and breadcrumb Admin / Operations" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "input", label: "🔍 Search by subject, email or content…", hotspot: 1 },
            { w: 7, kind: "tabs", label: "All · Open · In progress · Resolved · Closed (+ counters)", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 2, kind: "kpi", label: "Total", hotspot: 3 },
            { w: 2, kind: "kpi", label: "Open" },
            { w: 2, kind: "kpi", label: "In progress" },
            { w: 2, kind: "kpi", label: "Resolved" },
            { w: 2, kind: "kpi", label: "Closed" },
            { w: 2, kind: "kpi", label: "Today · 7 days" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "tabs", label: "Category: All · Bug / Technical · Order & reservation · Product & advice · Account & login · Other", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "● Subject · category + status pills · email · date · message preview", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "drawer", label: "Detail window: full message · Priority · Mark in progress · Mark resolved · Close ticket · Delete", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Search",
        desc: "Instantly filters the displayed rows by subject, email address or message content. Note: it only searches the tickets already shown on screen, not the whole database.",
      },
      {
        n: 2,
        label: "Status filters",
        desc: "Five pills: All, Open, In progress, Resolved, Closed. The small number next to each pill counts ALL tickets with that status in the database. Clicking reloads the list.",
      },
      {
        n: 3,
        label: "Number tiles",
        desc: "Seven counters: total, per status, plus “Today” (tickets received today) and “This week” (last 7 days). Read-only, recalculated every time the page loads.",
      },
      {
        n: 4,
        label: "Category filter",
        desc: "Narrows the displayed list by type of request. Messages from the Contact page form all arrive as “Other”; those from the site's help center carry the category chosen by the visitor (Bug, Order, Product, Account or Other).",
      },
      {
        n: 5,
        label: "Ticket list",
        desc: "“Open” tickets (never handled) are highlighted in color with a dot before the subject, and their subject is bold. An alert icon (a circle with an exclamation mark) appears to the left of the subject when the priority is High or Urgent. Clicking a row opens the detail window.",
      },
      {
        n: 6,
        label: "Detail window",
        desc: "Opens when you click a ticket: full message, the person's email address, sent date, “Priority” menu, status-change buttons (“Mark in progress”, “Mark resolved”, “Close ticket” — the one for the current status is hidden, and there is no button to set a ticket back to “Open”) and a “Delete” button. The Escape key or a click outside closes the window.",
      },
    ],
    workflows: [
      {
        title: "Handle a message received from the site",
        steps: [
          {
            title: "Spot the new ones",
            body: "Open the page: tickets that have never been handled are highlighted and marked with a dot. The “Open” pill at the top shows how many are left.",
          },
          {
            title: "Read the message",
            body: "Click the row. The detail window shows the full message, the person's email address and the sent date.",
          },
          {
            title: "Reply to the customer",
            body: "Copy their email address and reply from the pharmacy's mailbox. The panel does not send emails itself.",
          },
          {
            title: "Update the status",
            body: "Click “Mark in progress” if the matter still needs work, or “Mark resolved” once the reply has been sent. The handling date is then recorded on the ticket.",
          },
          {
            title: "Archive later",
            body: "When the matter is closed for good, “Close ticket” files it under the “Closed” filter. It can still be read.",
          },
        ],
      },
      {
        title: "Flag an urgent matter to the team",
        steps: [
          {
            title: "Open the ticket",
            body: "Click the row in question to open the detail window.",
          },
          {
            title: "Raise the priority",
            body: "In the “Priority” menu, choose “High” or “Urgent”. It saves immediately — there is no button to confirm.",
          },
          {
            title: "Check the list",
            body: "An alert icon appears before the subject (orange for High, red for Urgent): the whole team sees at a glance what's pressing.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Change the status (Mark in progress · Mark resolved · Close ticket)",
        where: "A ticket's detail window",
        does: "Moves the ticket forward in its lifecycle. Three buttons exist (In progress, Resolved, Closed); the one for the current status is hidden. No button can set a ticket back to “Open”.",
        effects: [
          "The ticket's status changes immediately and the window closes.",
          "The filter pills, number tiles and list highlighting all update.",
          "“Mark resolved” also records the handling date and time (“Handled on:”) and who did it; this note stays visible even if the status changes later.",
        ],
        severity: "safe",
        undo: "Open the ticket and pick another status among “In progress”, “Resolved” and “Closed”. Setting it back to “Open”, however, is impossible.",
        audited: true,
      },
      {
        label: "Change the priority",
        where: "“Priority” menu in the detail window",
        does: "Ranks the ticket as Low, Normal, High or Urgent to help the team sort their work.",
        effects: [
          "It saves immediately as soon as you pick a value (no “Save” button).",
          "With High or Urgent, an alert icon appears before the subject in the list.",
          "No effect for the customer: the priority is purely internal.",
        ],
        severity: "safe",
        undo: "Pick another value in the same menu.",
        audited: true,
      },
      {
        label: "Delete",
        where: "Red button in the detail window (with a confirmation prompt)",
        does: "Permanently erases the ticket from the database.",
        effects: [
          "The message, the email address and the ticket's whole history disappear forever.",
          "No email is sent to the person; they can of course write again via the site's form.",
          "The counters update immediately.",
        ],
        severity: "danger",
        audited: true,
      },
    ],
    flows: [
      {
        title: "Life of a contact message",
        lanes: [
          [
            {
              label: "Open",
              tone: "warn",
              note: "The message has just arrived from the site (Contact form or help center), with “Normal” priority. It stays highlighted in the list as long as it keeps this status.",
            },
            {
              label: "In progress",
              note: "Someone is handling it. Useful when the reply needs a check or a colleague's opinion.",
            },
            {
              label: "Resolved",
              tone: "ok",
              note: "The reply has been sent to the customer. The handling date and author are recorded on the ticket.",
            },
            {
              label: "Closed",
              note: "Matter archived. The ticket can still be read under the “Closed” filter.",
            },
          ],
          [
            {
              label: "Deleted",
              tone: "bad",
              note: "Possible at any stage from the detail window. Permanent: prefer “Close ticket” to keep the history.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "The list only shows the 10 most recent tickets for the chosen status, while the counters count everything. If the “Open” pill says 25, only the latest 10 are visible on screen.",
      "The search and the category filter only look through the tickets already displayed (so 10 at most) — not the whole database.",
      "Messages from the Contact page form all arrive in the “Other” category; only those from the help center carry a category chosen by the visitor. This screen does not let you change a ticket's category.",
      "The “Priority” menu saves as soon as you pick a value — there is no confirm button.",
      "“Mark resolved” sets the “Handled on” date on the ticket; if you later set it back to “In progress” or close it, that date stays visible.",
      "The panel sends no email to the customer — not when the message arrives, not on a status change, not on deletion. Every reply goes through your mailbox.",
      "Deletion is permanent, with no recycle bin. To tidy up without losing anything, use “Close ticket” instead.",
    ],
  },
  {
    id: "newsletter",
    navLabel: "Newsletter",
    title: "Newsletter — the subscriber list",
    route: "/admin/newsletter",
    intro:
      "This page lists the people who left their email address on the site to receive the newsletter. For each subscriber you see their language, their sign-up date and — the key point — whether they confirmed their subscription: after signing up, the visitor receives an email with a confirmation link valid for 24 hours; until they click it, the “Confirmed” column shows a dash. The screen lets you search for a subscriber, filter by language, export the list to a file for Excel and remove someone from the list. Note: sending the newsletter itself does not happen here — you export the list, then send from an external emailing tool.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Newsletter — title and breadcrumb Admin" },
          ],
        },
        {
          blocks: [
            { w: 3, kind: "kpi", label: "Total", hotspot: 1 },
            { w: 3, kind: "kpi", label: "FR" },
            { w: 3, kind: "kpi", label: "ES" },
            { w: 3, kind: "kpi", label: "EN" },
          ],
        },
        {
          blocks: [
            { w: 5, kind: "input", label: "🔍 Search email…", hotspot: 2 },
            { w: 4, kind: "input", label: "All languages ▾", hotspot: 3 },
            { w: 3, kind: "button", label: "⬇ Export CSV", hotspot: 4 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "Email · Language · Subscribed · Confirmed · Delete", hotspot: 5 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "text", label: "“Showing up to 500 rows…” (only appears when the list is full)", hotspot: 6 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Number tiles",
        desc: "Total subscribers displayed, then the breakdown by language (FR, ES, EN). Note: these numbers count the on-screen selection (500 rows at most) and change when you filter — not necessarily the absolute total of the list.",
      },
      {
        n: 2,
        label: "Search by email",
        desc: "Type part of an address: the list reloads from the database and only shows the matches, ignoring upper/lower case.",
      },
      {
        n: 3,
        label: "Language filter",
        desc: "Limits the list to subscribers who signed up in French, Spanish or English. The language is that of the site page where the person subscribed.",
      },
      {
        n: 4,
        label: "“Export CSV” button",
        desc: "Downloads a file (openable in Excel) with the subscribers matching the current filters, up to 1,000 rows. The file is named with today's date.",
      },
      {
        n: 5,
        label: "Subscriber table",
        desc: "One row per subscriber, newest first. Clicking the email address opens your email program. The “Confirmed” column shows the confirmation date, or a dash if the person has not yet clicked the link received by email. The “Delete” button sits at the end of each row.",
      },
      {
        n: 6,
        label: "Limit warning",
        desc: "Only appears when the list reaches 500 rows: some subscribers are then not displayed — refine the search or the language filter to see them.",
      },
    ],
    workflows: [
      {
        title: "Prepare a newsletter send",
        steps: [
          {
            title: "Pick the language",
            body: "Select the campaign language in the filter (for example “Español”) to keep only the relevant subscribers.",
          },
          {
            title: "Export the list",
            body: "Click “Export CSV”. The downloaded file honors the current filters and contains up to 1,000 subscribers.",
          },
          {
            title: "Keep the confirmed ones",
            body: "In the file, discard the rows whose confirmation column is empty: those people did not validate their subscription and must not be emailed.",
          },
          {
            title: "Send from your tool",
            body: "Import the remaining addresses into your email-sending tool. The admin panel does not send the newsletter itself.",
          },
        ],
      },
      {
        title: "Remove someone who no longer wants emails",
        steps: [
          {
            title: "Find the subscriber",
            body: "Type their address (or part of it) in the “Search email…” field.",
          },
          {
            title: "Delete the row",
            body: "Click “Delete” at the end of the row, then confirm. The removal is immediate and permanent.",
          },
          {
            title: "Know what happens next",
            body: "The person receives no message from us. They can re-subscribe at any time from the site if they change their mind.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Export CSV",
        where: "Button at the top right of the filter bar",
        does: "Downloads the list of subscribers matching the current filters as a file for Excel (up to 1,000 rows).",
        effects: [
          "For each subscriber, the file contains: an internal identifier, the email address, the language, the sign-up date and the confirmation date (empty if pending).",
          "Subscribers' IP addresses are never exported (personal data protection).",
          "Nothing is changed in the database — it's a simple copy. The file does contain personal addresses though: keep it somewhere safe and do not share it outside the pharmacy.",
        ],
        severity: "caution",
      },
      {
        label: "Delete",
        where: "Red button at the end of each table row (with a confirmation prompt)",
        does: "Permanently removes the subscriber from the mailing list.",
        effects: [
          "The row is erased from the database: address, language, sign-up and confirmation dates disappear forever.",
          "No email is sent to inform the person.",
          "They can re-subscribe themselves at any time from the site (they will go through the confirmation email again).",
          "The number tiles update immediately.",
        ],
        severity: "danger",
        audited: true,
      },
    ],
    flows: [
      {
        title: "A subscriber's journey",
        lanes: [
          [
            {
              label: "Sign-up on the site",
              note: "The visitor leaves their address in the site's newsletter form. They appear in the list right away.",
            },
            {
              label: "Confirmation email",
              tone: "warn",
              note: "An email with a link is sent to them. The link is valid for 24 hours. In the meantime, the “Confirmed” column shows a dash.",
            },
            {
              label: "Confirmed",
              tone: "ok",
              note: "The person clicked the link: the date appears in the “Confirmed” column. They can receive the newsletter.",
            },
          ],
          [
            {
              label: "No click within 24 hours",
              tone: "warn",
              note: "The subscription stays pending. If the person signs up again with the same address, the site automatically sends them a fresh confirmation link.",
            },
          ],
          [
            {
              label: "Removed from the list",
              tone: "bad",
              note: "Via this screen's “Delete” button, or by the person themselves from their customer account. Permanent, but re-subscribing remains possible.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "The number tiles count what is displayed on screen (500 rows at most), not necessarily the whole list — and they change as soon as you filter.",
      "The list stops at 500 rows (a message points it out at the bottom). The export, however, goes up to 1,000 rows.",
      "The export honors the current filters: to export everyone, clear the search and set “All languages” back before clicking.",
      "A dash in the “Confirmed” column means the person did not validate their subscription: do not send them the newsletter.",
      "Deletion is immediate, permanent and silent (no email to the person). There is no recycle bin.",
      "Some subscriptions are confirmed outright, with no email: that's the case when a logged-in customer re-subscribes from their account, or if email sending is not configured on the site.",
      "This screen is only for managing the list: writing and sending the newsletter happen in an external tool, from the exported file.",
    ],
  },
]
