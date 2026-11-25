# Inventra — Inventory Management

A small inventory app for **Sen & Sons Electricals**, a fictional electrical wholesaler with three godowns around Kolkata. It covers stock, sales, purchases, transfers between godowns, a customer/supplier directory and reports, and every module is connected to the same data.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4** and **shadcn/ui**. No login and no backend: the app runs on sample data saved in the browser.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 with shadcn/ui CSS variables mapped to the Inventra palette |
| Components | [shadcn/ui](https://ui.shadcn.com) (new-york style) on Radix UI primitives |
| Charts | shadcn Chart (Recharts) |
| Toasts | Sonner via the shadcn `Toaster` |
| Icons | lucide-react |

shadcn/ui components used: Sidebar, Breadcrumb, Button, Card, Badge, Table, Tabs, Toggle Group, Input Group, Input, Select, Field, Label, Dialog, Sheet, Progress, Skeleton, Separator, Avatar, Tooltip, Chart and Sonner. They live in `src/components/ui/` and are configured by `components.json`, so `npx shadcn add <component>` works as usual.

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
│   ├── ui/                 shadcn/ui components (vendored source, owned by the project)
│   ├── shared/             App components built on shadcn: DataTable, FilterChips,
│   │                       SearchInput, ViewTabs, Panel, StatCard, StatusBadge, charts…
│   ├── layout/             App shell, sidebar, navigation config
│   ├── overlays/           Item & order sheets, sale / PO / transfer dialogs
│   ├── providers/          UI state (open sheet, open form)
│   └── <module>/           One folder per module view
├── hooks/                  useCommands (workflows → store + toast), useUrlFilter, useIsMobile
├── lib/                    Types, constants, seed data, formatters, selectors, status styles
└── store/                  Pure workflow commands + the persisted store
```

## Design decisions

- **Business logic is pure and lives outside React.** `store/commands.ts` holds `dispatchSale`, `receivePurchase`, `transferStock` and the other workflows. Each takes the current state and returns the next state plus a message, or an error. That keeps the rules in one readable place and easy to test.
- **The store is `useSyncExternalStore`.** The server and the first client render use the seed data, and the browser then switches to the saved copy. This avoids hydration mismatches without effects or loading flags.
- **Filters live in the URL** (`/stock?status=low`, `/sales?status=confirmed`), so dashboard tiles link straight to filtered views and those views can be bookmarked.
- **shadcn/ui is used as intended: the source is owned.** The project made a few small edits: status variants on `Badge`, an `indicatorClassName` on `Progress`, a light-only `Toaster`, and two fixes so the vendored code passes the React Compiler lint rules (`useIsMobile` uses `useSyncExternalStore`; the sidebar skeleton has no `Math.random`).
- **App-specific components wrap shadcn rather than fork it.** `components/shared/` composes shadcn primitives into things the modules repeat, such as a column-driven `DataTable` on shadcn `Table` and status filters on `ToggleGroup`.
- **Charts render in the browser only** (`use(browser())` inside `Suspense`), because Recharts measures the DOM and generates random ids, which Next 16 does not allow while prerendering.
- **Dialogs and detail sheets come from shadcn (Radix)**, which handles focus trapping, Escape and screen-reader labelling.
- **A fixed business date (25 Nov 2026)** keeps "today", "overdue" and "this month" consistent with the sample data whenever the demo is opened.
- **The Inter font is self-hosted** via `next/font/local`, so the build never needs network access to Google Fonts.
- **Accessibility**: Radix-based components, labelled inputs and icon buttons, an active state in the nav, and a title and description on every dialog.
- **Responsive**: the shadcn Sidebar becomes a sheet on mobile (toggle with the button or ⌘/Ctrl+B), grids reflow, and wide tables scroll inside their card.
