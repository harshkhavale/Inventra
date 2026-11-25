# Inventra — Inventory Management

A small inventory app for **Sen & Sons Electricals**, a fictional electrical wholesaler with three godowns around Kolkata. It covers stock, sales, purchases, transfers between godowns, a customer/supplier directory and reports, and every module is connected to the same data.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS v4**. No login and no backend: the app runs on sample data saved in the browser.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

Changes are saved to `localStorage`, so they survive a refresh. Use **Reset demo data** at the bottom of the sidebar to start over.

## How the workflow connects

```
Purchase order ──receive──▶ stock goes up at that godown ──┐
                                                           ├──▶ stock history, activity feed,
Sales order ──dispatch──▶ invoice raised, stock goes down ─┤     low stock alerts, reports
                                                           │
Transfer ──▶ stock moves between godowns ──────────────────┘
```

- **Receiving a PO** adds its quantities to the receiving godown and records a stock movement. If an item goes back above its minimum, the toast says so.
- **Dispatching a sales order** checks that the godown holds enough of every line. If it does, it reduces stock, raises the next invoice number and moves the order to *Dispatched*. If it doesn't, it explains what's short and suggests a transfer or a PO.
- **Low stock** (below the item's minimum level) appears on the Dashboard with what's already on order and a one-click **Reorder**. Reorder pre-fills a PO with the usual supplier, its lead time and a suggested quantity.
- **Payments**: dispatched orders can be marked paid, which updates receivables in the directory and in reports.

Every number on screen (KPIs, balances, reports) is calculated from the orders and movements. None of it is stored separately, so it can't drift out of sync.

## Modules

| Module | What's there |
| --- | --- |
| **Dashboard** | KPIs (each links to its filtered view), 14-day sales chart, stock value by godown, low stock alerts, dispatch queue, incoming POs, activity feed |
| **Sales** | Orders & invoices with status chips (Confirmed → Dispatched → Paid), search, dispatch / mark paid, order drawer with line items, availability and progress |
| **Purchases** | POs with Pending / Overdue / Received filters, search by PO, supplier or item, receive, on-time tracking |
| **Stock** | Items per godown with min level and status, filters by level and category, search, and a full **stock history** of every movement |
| **Godowns** | Per-location value, units and SKUs, item-wise stock with share of each item, recent transfers, transfer form |
| **Customers & suppliers** | Contacts, GSTIN, live billed and outstanding amounts, supplier lead times |
| **Reports** | Stock, sales and purchase reports over 7, 30 or 90 days, with CSV export |

Clicking any item opens an **item drawer** with stock by godown, on order and committed quantities, pricing and margin, and its movement history with the running balance.

## Project structure

```
src/
├── app/                    Routes. Pages are thin and mostly server-rendered headers.
├── components/
│   ├── ui/                 Design-system primitives: Button, Badge, Card, DataTable,
│   │                       FilterChips, Segmented, Modal/Drawer, charts…
│   ├── layout/             App shell, sidebar, navigation config
│   ├── overlays/           Item & order drawers, sale / PO / transfer forms, toast
│   ├── providers/          UI state (open drawer, open form, toast)
│   └── <module>/           One folder per module view
├── hooks/                  useCommands (workflows → store + toast), useUrlFilter
├── lib/                    Types, constants, seed data, formatters, selectors, status styles
└── store/                  Pure workflow commands + the persisted store
```

## Design decisions

- **Business logic is pure and lives outside React.** `store/commands.ts` holds `dispatchSale`, `receivePurchase`, `transferStock` and the other workflows. Each takes the current state and returns the next state plus a message, or an error. That keeps the rules in one readable place and easy to test.
- **The store is `useSyncExternalStore`.** The server and the first client render use the seed data, and the browser then switches to the saved copy. This avoids hydration mismatches without effects or loading flags.
- **Filters live in the URL** (`/stock?status=low`, `/sales?status=confirmed`), so dashboard tiles link straight to filtered views and those views can be bookmarked.
- **Drawers and modals use the native `<dialog>` element**, which handles focus trapping, Escape and the inert background. The toast is a manual popover, so it shows above an open drawer.
- **A fixed business date (25 Nov 2026)** keeps "today", "overdue" and "this month" consistent with the sample data whenever the demo is opened.
- **The Inter font is self-hosted** via `next/font/local`, so the build never needs network access to Google Fonts.
- **Accessibility**: real buttons and links throughout, labelled inputs and icon buttons, `aria-pressed` on filters, `aria-current` in the nav, and reduced-motion support.
- **Responsive**: the sidebar becomes a slide-out menu, grids reflow, and wide tables scroll inside their card.
