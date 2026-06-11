import type { TutoSection } from '../../types'

export const sections: TutoSection[] = [
  {
    id: "users",
    navLabel: "Customers",
    title: "Customers — every account registered on the site",
    route: "/admin/users",
    intro:
      "This page lists everyone who has an account on the site: customers, but also team members (which are customer accounts with admin rights added on top). For each one you see their name, email address, phone, preferred language, account creation date and last login. Name display rule: a team member appears under their display name, a customer under their first and last name. This is also where a super admin can grant or remove access to the admin panel: you don't create a special account for an employee — you promote an account already registered on the site. Regular admins can see the list but cannot change anything in it.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Customers — title and breadcrumb Admin" },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "kpi", label: "Users (page)", hotspot: 1 },
            { w: 4, kind: "kpi", label: "Admins" },
            { w: 4, kind: "kpi", label: "With phone" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "input", label: "🔍 Search email, name, phone…", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "User · Contact · Language · Created · Last login · Role", hotspot: 3 },
          ],
        },
        {
          blocks: [
            { w: 7, kind: "button", label: "Make admin / Admin (Role column)", hotspot: 4 },
            { w: 5, kind: "toolbar", label: "Page 1 · Previous · Next", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Number tiles",
        desc: "Three counters: users shown, admins and accounts with a phone number. Careful: they only count the page on screen (50 accounts at most), not the whole database.",
      },
      {
        n: 2,
        label: "Search",
        desc: "Filters by email, first name, last name, display name or phone, ignoring upper and lower case. Typing always brings you back to the first page, and the search only looks through the 50 accounts on the current page: if the person doesn't show up, clear the search and browse the pages with “Next”.",
      },
      {
        n: 3,
        label: "Accounts table",
        desc: "One row per account. The name follows the rule: display name for a team member, first + last name for a customer (a dash if the profile has no name at all). Clicking the email opens your mail app; clicking the phone opens a WhatsApp conversation. The “auto” language means the person hasn't chosen a preferred language. “Never” as last login: the account has never been used to log in (for example an account created at the counter by the team).",
      },
      {
        n: 4,
        label: "Role column",
        desc: "If you are a super admin, a button appears on every row (except super admins): “Make admin” for a customer, “Admin” to remove a team member's rights. If you are a regular admin, you only see read-only “Admin” / “Super admin” badges, or a dash for customers.",
      },
      {
        n: 5,
        label: "Pagination",
        desc: "The list moves in pages of 50 accounts. “Next” greys out when the page on screen isn't full: either there is nothing left after it, or an active search is shrinking the page — clear it to keep browsing.",
      },
    ],
    workflows: [
      {
        title: "Find a customer and contact them",
        steps: [
          {
            title: "Search for the account",
            body: "Type part of their email, name or phone into the search field. The list updates as you type.",
          },
          {
            title: "Widen the search if needed",
            body: "The search only covers the 50 accounts on the current page, and typing always brings you back to the first page. If nothing comes up, clear the search and browse the pages with “Next” to spot the account by eye.",
          },
          {
            title: "Contact",
            body: "Click their email to open your mail app, or their phone to open a WhatsApp conversation directly.",
          },
        ],
      },
      {
        title: "Give a new employee access to the panel",
        steps: [
          {
            title: "Have them create a normal account",
            body: "The employee signs up on the public site like any customer. There is no separate “admin” account: rights are added to an existing account.",
          },
          {
            title: "Find their account",
            body: "Logged in as a super admin, search for their email on this page.",
          },
          {
            title: "Promote",
            body: "Click “Make admin” at the end of their row, then confirm in the small window. Access is immediate.",
          },
          {
            title: "Check",
            body: "The button on their row now shows “Admin”. The person can open the admin panel on their next visit, while keeping their customer account (cart, reservations, favourites).",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Make admin",
        where: "Button in the “Role” column, on a customer's row — only visible if you are a super admin",
        does: "Gives this account full access to the admin panel, with the “Admin” role.",
        effects: [
          "A confirmation window shows the email concerned; nothing happens if you cancel.",
          "The person immediately gets access to the whole panel: products, prices, stock, reservations, sales, customers, and accounting (including purchase costs and margins).",
          "They keep their whole customer account: cart, reservations, favourites, profile — nothing is lost.",
          "If their profile has a display name, their name now shows under that display name in lists (team member display rule); otherwise their first and last name stay shown.",
          "The operation is recorded in the activity log.",
        ],
        severity: "caution",
        undo: "Click the same button (now “Admin”) to remove the rights — everything goes back to how it was.",
        audited: true,
      },
      {
        label: "Admin (remove rights)",
        where: "The same button, on a team member's row (Admin role) — only visible if you are a super admin",
        does: "Removes this account's access to the admin panel.",
        effects: [
          "A confirmation window shows the email concerned; nothing happens if you cancel.",
          "The person can no longer open the admin panel from their next visit.",
          "Their customer account stays intact: they can still log in to the site, reserve, see their history.",
          "Impossible on yourself and on a super admin: the site blocks both cases, no matter how hard you try.",
          "The operation is recorded in the activity log.",
        ],
        severity: "safe",
        undo: "Click “Make admin” on the same row to give the rights back.",
        audited: true,
      },
    ],
    gotchas: [
      "The three number tiles count the page on screen (50 accounts at most), not the total of everyone registered.",
      "The search only looks through the 50 accounts of the current page, and typing always brings you back to the first page. While a search is active, “Next” usually stays greyed out: to look further, clear the text and browse the pages one by one.",
      "A dash instead of the name means the profile has neither a name nor a display name (the email, shown just below, remains the reliable reference).",
      "“Make admin” always grants the standard “Admin” role: the person can do everything in the panel except manage the admin team. Role changes (making someone a super admin) happen on the “Administrators” page in the menu, not here.",
      "You can neither remove your own rights nor touch another super admin — that's a protection against accidental lock-outs, not a malfunction.",
      "If you are a regular admin, the button doesn't appear at all: rights management is reserved for super admins.",
      "This screen lets you neither delete a customer account nor edit their information: customers manage their own profile from their personal area on the site.",
      "“Never” as last login is normal for accounts created by the team at the counter (the customer has never logged in themselves yet).",
    ],
  },
  {
    id: "reviews",
    navLabel: "Reviews",
    title: "Product reviews — moderate what customers publish",
    route: "/admin/reviews",
    intro:
      "Logged-in customers can leave a review (a 1-to-5-star rating, plus an optional title and text) at the bottom of every product page on the site. Each review lands here with the “Pending” status and stays invisible to everyone until you approve it. Only approved reviews appear on the public product page, and only they count towards the average rating shown (that rating is also passed on to search engines). The page opens directly on the “Pending” filter: that's your moderation queue. A customer can only have one review per product.",
    mockup: {
      rows: [
        {
          blocks: [
            { w: 12, kind: "text", label: "Product reviews — title and breadcrumb Admin / Customers" },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "tabs", label: "All · Pending · Approved · Rejected", hotspot: 1 },
          ],
        },
        {
          blocks: [
            { w: 12, kind: "table", label: "★★★★☆ · status · Verified purchase · title + text · product · author · date", hotspot: 2 },
          ],
        },
        {
          blocks: [
            { w: 4, kind: "button", label: "✓ Approve", hotspot: 3 },
            { w: 4, kind: "button", label: "✕ Reject", hotspot: 4 },
            { w: 4, kind: "button", label: "🗑 Delete", hotspot: 5 },
          ],
        },
      ],
    },
    hotspots: [
      {
        n: 1,
        label: "Status filters",
        desc: "Four pills: All, Pending, Approved, Rejected. The page opens on “Pending” — if it looks empty, it doesn't mean there are no reviews at all: click “All” to see everything.",
      },
      {
        n: 2,
        label: "Review list",
        desc: "Newest to oldest (200 at most). Each row shows the stars, the status pill, the “Verified purchase” badge when relevant, the review's title and text, then the product concerned, the author's name (or “Customer” if they have none) and the date.",
      },
      {
        n: 3,
        label: "Approve button (check mark)",
        desc: "Publishes the review on the site's product page. The button only appears if the review isn't already approved.",
      },
      {
        n: 4,
        label: "Reject button (cross)",
        desc: "Keeps the review off the site, without deleting it. The button only appears if the review isn't already rejected. Also used to unpublish an already approved review.",
      },
      {
        n: 5,
        label: "Delete button (trash can)",
        desc: "Erases the review for good. A small confirmation notification appears at the top right of the screen with a “Delete” button: if you ignore it, nothing is deleted.",
      },
    ],
    workflows: [
      {
        title: "Moderate pending reviews",
        steps: [
          {
            title: "Open the queue",
            body: "The page already opens on “Pending”: these are the reviews nobody can see yet.",
          },
          {
            title: "Read the review",
            body: "Check the rating, the text and the product concerned. The “Verified purchase” badge means this customer actually collected a reservation containing this product — it's computed automatically, you cannot change it.",
          },
          {
            title: "Decide",
            body: "Click the check mark to publish the review on the product page, or the cross to keep it off the site. The row immediately leaves the “Pending” queue.",
          },
          {
            title: "Check on the site (optional)",
            body: "The approved review appears on the public product page after about a minute, and the product's average rating updates.",
          },
        ],
      },
      {
        title: "Take down an already published review",
        steps: [
          {
            title: "Filter published reviews",
            body: "Click the “Approved” pill to see only the reviews currently visible on the site.",
          },
          {
            title: "Find the review",
            body: "Spot the row by product name, author or date.",
          },
          {
            title: "Reject rather than delete",
            body: "Click the cross: the review leaves the product page (within about a minute) but stays kept in the “Rejected” filter, in case it ever needs republishing. Deletion, on the other hand, is final.",
          },
        ],
      },
    ],
    actions: [
      {
        label: "Approve",
        where: "Check-mark button at the end of every row (except already approved reviews)",
        does: "Publishes the review on the public site's product page.",
        effects: [
          "The status switches to “Approved” and the row leaves the “Pending” queue.",
          "The review appears on the public product page after about a minute (the page shows the 50 most recent approved reviews).",
          "The rating enters the average and the review count shown on the product page; that average is also passed on to search engines.",
          "The customer is not notified: no message is sent to them.",
        ],
        severity: "caution",
        undo: "Click “Reject” on the same review: it disappears from the site and the average is recalculated.",
        audited: true,
        publicImpact: "The review and its rating become visible to everyone on the product page.",
      },
      {
        label: "Reject",
        where: "Cross button at the end of every row (except already rejected reviews)",
        does: "Keeps the review off the public site, without erasing it.",
        effects: [
          "The status switches to “Rejected”: the review is visible nowhere on the site, not even to its author.",
          "If the review was approved, it disappears from the product page within about a minute and the average rating is recalculated without it.",
          "The review stays available here in the “Rejected” filter and can be republished at any time.",
          "The customer is not notified and cannot see that their review was rejected.",
        ],
        severity: "caution",
        undo: "Click “Approve” on the same review to republish it.",
        audited: true,
        publicImpact: "If the review was published, it disappears from the product page and the average changes.",
      },
      {
        label: "Delete",
        where: "Trash-can button at the end of every row, then the “Delete” button in the confirmation notification at the top right",
        does: "Permanently erases the review from the database.",
        effects: [
          "The review disappears forever: rating, title, text, verified-purchase badge — there is no recovery bin.",
          "If it was approved, it also disappears from the product page and the average is recalculated.",
          "Since a customer is only allowed one review per product, deleting it lets them write a new one for that product.",
          "The customer is not notified.",
        ],
        severity: "danger",
        audited: true,
        publicImpact: "If the review was published, it disappears from the product page.",
      },
    ],
    flows: [
      {
        title: "Life of a customer review",
        lanes: [
          [
            {
              label: "The customer writes a review",
              note: "From the bottom of the product page, logged in to their account. The site replies “Your review will be published after moderation”.",
            },
            {
              label: "Pending",
              tone: "warn",
              note: "Invisible to everyone on the site. This is the queue shown when this page opens.",
            },
            {
              label: "Approved",
              tone: "ok",
              note: "Visible on the product page, counted in the average rating. Can be unpublished at any time via “Reject”.",
            },
          ],
          [
            {
              label: "Rejected",
              tone: "warn",
              note: "Hidden from the site but kept here. Can be republished later via “Approve”.",
            },
          ],
          [
            {
              label: "The customer edits their review",
              tone: "warn",
              note: "If they submit a new review on the same product, it replaces the old one and goes back to “Pending” — even an approved review then disappears from the site until your next validation.",
            },
          ],
          [
            {
              label: "Deleted",
              tone: "bad",
              note: "Final, with no possible recovery. The customer can then write a new review on that product.",
            },
          ],
        ],
      },
    ],
    gotchas: [
      "The page opens on the “Pending” filter: an empty list only means there is nothing to moderate — click “All” to see everything.",
      "Only approved reviews are visible on the site. A pending or rejected review appears nowhere, not even to the customer who wrote it.",
      "If a customer submits a review again on the same product, the new version replaces the old one and goes back to “Pending”: an already approved review then disappears from the site until you approve the new version.",
      "The “Verified purchase” badge is set automatically when the customer collected a reservation containing this product at the pharmacy. You can neither add it nor remove it.",
      "After an approval or a rejection, the public product page updates within about a minute — no need to worry if the change isn't instant.",
      "Prefer “Reject” over “Delete” to take a review down: a rejection can be undone, a deletion is final. Deleting also frees up the customer's right to write a new review on that product.",
      "The delete confirmation is a small notification at the top right of the screen, not a window in the centre: if you don't click its “Delete” button, nothing is erased.",
      "The customer is never notified of an approval, a rejection or a deletion — no message is sent to them.",
      "The list shows the 200 most recent reviews for the chosen filter.",
      "Deleting a product from the catalogue also erases all its reviews, permanently.",
    ],
  },
]
