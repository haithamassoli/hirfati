# Hirfati — Skilled Trades Marketplace PRD

## Summary

Two-sided marketplace connecting skilled trade providers (plumbers, carpenters, electricians, blacksmiths, etc.) with customers in Jordan. Operates in Amman, Irbid, and Zarqa. Providers list services and get discovered; users browse providers or post requests to receive bids. Full job lifecycle from request to review with in-app chat. Free at launch, monetized via premium ads and priority visibility. Commission on transactions planned for a future phase.

Tech stack: Next.js (SSR/SEO), TailwindCSS, Convex, Better-Auth (Google OAuth), PWA.

---

## Users & Roles

### Guest

- Browse providers, categories, and listings
- View provider profiles and reviews
- Search and filter services
- Cannot interact (no chat, no requests, no quotes)

### Customer (Authenticated)

- Post service requests with description, location, price range, and photos
- Browse and contact providers directly
- Accept/reject quotes
- Confirm job completion and release payment
- Rate and review providers
- Chat with providers

### Provider (Authenticated)

- Create and manage a provider profile (bio, skills, portfolio photos, service area)
- List services under admin-defined categories with fixed or flexible pricing
- Browse open requests and submit quotes
- Accept/reject job requests from customers
- Mark jobs as complete
- Chat with customers
- Purchase premium ads / priority visibility

### Admin - out of the scope right now the admin see the database

- Manage trade categories and subcategories
- Manage users (ban, verify, resolve disputes)
- Manage premium ad placements and visibility boosts
- View platform analytics (users, jobs, revenue)
- Moderate reviews and reported content

> A single account can act as both customer and provider.

---

## Core Flows

### Flow 1: Provider Gets Discovered

1. Provider signs up via Google → completes profile
2. Provider selects trade categories → lists services with pricing (fixed/flexible)
3. Provider uploads portfolio work (photos, descriptions)
4. Provider appears in search results for their category and city
5. Customer finds provider → views profile → sends direct request
6. Job lifecycle begins

### Flow 2: Customer Posts a Request

1. Customer signs up via Google
2. Customer posts a request: category, description, location, photos (optional), price range
3. Matching providers in that city/category see the request
4. Providers submit quotes (price, estimated timeline, message)
5. Customer reviews quotes → accepts one
6. Job lifecycle begins

### Flow 3: Job Lifecycle

```
Request → Quote → Accept → Chat → Work Done → Customer Confirms → Pay → Review
```

States:

- **Requested** — customer sent request or provider received direct hire
- **Quoted** — provider submitted a quote
- **Accepted** — customer accepted the quote
- **In Progress** — work has started (either party can mark)
- **Completed** — provider marks work as done
- **Confirmed** — customer confirms completion
- **Reviewed** — customer leaves a rating/review
- **Cancelled** — either party cancels (only before "In Progress")
- **Disputed** — either party raises an issue (admin intervenes)

### Flow 4: Chat

- Unlocked after a quote is submitted or a direct request is sent
- Text messages and image sharing
- Tied to a specific job (not a general inbox)
- Real-time via Convex subscriptions

---

## Information Architecture

### Trade Categories (Admin-Defined)

Examples:

- Plumbing
- Electrical
- Carpentry
- Blacksmithing
- Painting
- HVAC
- Tiling & Flooring
- General Maintenance

Each category can have subcategories (e.g., Plumbing → Faucet Repair, Pipe Installation).

### Provider Profile

| Field            | Type                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| Display name     | string                                                                      |
| Avatar           | image (from Google or upload)                                               |
| Bio              | text (max 500 chars)                                                        |
| Trade categories | multi-select                                                                |
| Service area     | city (Amman / Irbid / Zarqa)                                                |
| Portfolio        | array of {image, caption}                                                   |
| Services         | array of {title, description, category, price_type (fixed/flexible), price} |
| Rating           | computed average                                                            |
| Review count     | computed                                                                    |
| Member since     | date                                                                        |
| Premium badge    | boolean                                                                     |

### Service Listing

| Field       | Type                                                       |
| ----------- | ---------------------------------------------------------- |
| Title       | string                                                     |
| Description | text                                                       |
| Category    | reference to category                                      |
| Price type  | enum: fixed / flexible                                     |
| Price       | number (JOD) — exact if fixed, "starting from" if flexible |
| Provider    | reference                                                  |

### Service Request (Customer-Posted)

| Field       | Type                           |
| ----------- | ------------------------------ |
| Title       | string                         |
| Description | text                           |
| Category    | reference to category          |
| City        | enum: Amman / Irbid / Zarqa    |
| Budget min  | number (JOD)                   |
| Budget max  | number (JOD)                   |
| Photos      | array of images (optional)     |
| Status      | enum: open / assigned / closed |
| Posted by   | reference                      |

### Quote

| Field              | Type                                            |
| ------------------ | ----------------------------------------------- |
| Job reference      | reference to request or direct hire             |
| Provider           | reference                                       |
| Price              | number (JOD)                                    |
| Estimated duration | string                                          |
| Message            | text                                            |
| Status             | enum: pending / accepted / rejected / withdrawn |

### Review

| Field         | Type                 |
| ------------- | -------------------- |
| Job reference | reference            |
| Reviewer      | reference (customer) |
| Rating        | 1–5                  |
| Comment       | text                 |
| Created at    | date                 |

---

## Pages & Routes

### Public (SSR, SEO-optimized)

| Route                | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `/`                  | Landing page — search bar, top categories, featured providers |
| `/categories`        | All trade categories                                          |
| `/categories/[slug]` | Providers and listings in a category, filterable by city      |
| `/providers/[id]`    | Provider profile — bio, portfolio, services, reviews          |
| `/requests`          | Open service requests (browsable by providers)                |
| `/requests/[id]`     | Single request detail                                         |
| `/about`             | About the platform                                            |

### Authenticated

| Route                  | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `/dashboard`           | Role-aware dashboard (customer jobs / provider jobs)           |
| `/dashboard/profile`   | Edit profile (provider details, portfolio, services)           |
| `/dashboard/services`  | Manage listed services (provider)                              |
| `/dashboard/requests`  | My posted requests (customer) / browseable requests (provider) |
| `/dashboard/jobs`      | Active and past jobs                                           |
| `/dashboard/jobs/[id]` | Job detail — status, chat, actions                             |
| `/dashboard/reviews`   | Reviews received/given                                         |
| `/dashboard/premium`   | Premium ad purchase and visibility boost                       |

### Admin

| Route               | Purpose                     |
| ------------------- | --------------------------- |
| `/admin`            | Admin dashboard             |
| `/admin/categories` | CRUD trade categories       |
| `/admin/users`      | User management             |
| `/admin/jobs`       | Job oversight and disputes  |
| `/admin/reports`    | Reported content moderation |
| `/admin/analytics`  | Platform metrics            |

---

## SEO Strategy

- All public pages use Next.js SSR (`getServerSideProps` or App Router server components)
- Dynamic `<title>`, `<meta description>`, and Open Graph tags per page
- Structured data (JSON-LD) for provider profiles (LocalBusiness schema) and service listings (Service schema)
- Sitemap generation for all public routes
- Arabic + English support in meta tags (Jordan market)
- Clean URL slugs for categories (`/categories/plumbing` not `/categories/123`)
- Canonical URLs to avoid duplicate content

---

## Monetization (MVP)

### Premium Ads

- Providers pay to have a banner/card ad on category pages or the homepage
- Admin manages ad slots, duration, and pricing

### Priority Visibility

- Providers pay to rank higher in search results within their category/city
- Visually indicated with a subtle badge or highlight
- Time-limited (7 days, 30 days, etc.)

### Future: Transaction Commission

- Platform takes a percentage of each completed job payment
- Requires escrow or integrated payment (deferred to post-MVP)

---

## PWA Requirements

- `manifest.json` with app name, icons, theme color
- Service worker for offline shell and caching of static assets
- Installable on Android/iOS home screen
- Push notifications (Convex-backed) for:
  - New quote received
  - Quote accepted/rejected
  - New chat message
  - Job status changes

---

## Technical Decisions

| Concern        | Decision                                           |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js (App Router)                               |
| Styling        | TailwindCSS                                        |
| Backend/DB     | Convex (real-time, serverless)                     |
| Auth           | Better-Auth with Google OAuth                      |
| Rendering      | SSR for public pages, CSR for dashboard            |
| PWA            | next-pwa or manual service worker                  |
| Image storage  | Convex file storage                                |
| Real-time chat | Convex subscriptions                               |
| Search         | Convex full-text search (or Convex + custom index) |
| Notifications  | Convex scheduled functions + Web Push API          |
| Hosting        | Vercel                                             |
| Language       | Arabic primary, English secondary                  |

---

## Data Relationships (Convex Schema Overview)

```
users
  ├── has many services (if provider)
  ├── has many requests (if customer)
  ├── has many quotes (if provider)
  ├── has many reviews (received + given)
  └── has many jobs (as customer or provider)

categories
  └── has many subcategories

services
  ├── belongs to user (provider)
  └── belongs to category

requests
  ├── belongs to user (customer)
  ├── belongs to category
  └── has many quotes

quotes
  ├── belongs to request
  └── belongs to user (provider)

jobs
  ├── belongs to request or direct hire
  ├── has one customer
  ├── has one provider
  ├── has many messages (chat)
  └── has one review

messages
  └── belongs to job

reviews
  ├── belongs to job
  └── belongs to user (reviewer)

premium_orders
  ├── belongs to user (provider)
  └── type: ad | visibility_boost
```

---

## Non-Functional Requirements

- **Performance**: LCP < 2.5s on public pages, real-time chat latency < 500ms
- **Accessibility**: WCAG 2.1 AA, RTL layout support for Arabic
- **Security**: Auth tokens via httpOnly cookies, input sanitization, rate limiting on quotes/requests
- **Scalability**: Convex handles scaling; optimize image sizes on upload
- **Mobile**: Fully responsive, touch-friendly, PWA-installable

---

## Out of Scope (MVP)

- Payment/escrow integration
- Transaction commission
- SMS/email notifications (push only)
- Video calls
- Multi-language UI (Arabic-first, English later)
- Provider identity/license verification
- Mobile native apps
- Locations beyond Amman, Irbid, Zarqa
