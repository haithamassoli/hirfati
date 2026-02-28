# Hirfati — Project Milestones & Tasks

## Milestone 1: Project Foundation & Infrastructure

Set up the Next.js project with App Router, TailwindCSS, Convex backend, Better-Auth with Google OAuth, and PWA configuration. Establish the base layout with RTL/Arabic support, responsive design system, and shared UI components. Configure Convex schema for all data models.

**Exit Criteria:** App boots with auth working, Convex connected, RTL layout rendering, and all database tables defined.

### Tasks

- [x] 1.1 — Initialize Next.js project with App Router and TypeScript
- [x] 1.2 — Configure TailwindCSS with RTL support and Arabic typography (font, direction)
- [x] 1.3 — Set up Convex backend and connect to the Next.js app
- [x] 1.4 — Define Convex schema for all tables: users, categories, services, requests, quotes, jobs, messages, reviews, premium_orders
- [x] 1.5 — Set up Better-Auth with Google OAuth (sign-in, sign-out, session management, httpOnly cookies)
- [x] 1.6 — Build root layout with RTL `<html dir="rtl" lang="ar">`, global styles, and responsive container and use IBM_Plex_Sans_Arabic font.
- [x] 1.7 — Create shared UI components (Button, Input, Card, Modal, Avatar, Badge, Spinner)
- [x] 1.8 — Configure PWA basics: `manifest.json` with app name, icons, theme color
- [x] 1.9 — Set up Convex file storage for image uploads (avatar, portfolio, request photos)
- [x] 1.10 — Create auth guard middleware for protected `/dashboard` routes
- [x] 1.11 — Seed initial trade categories and subcategories into Convex (Plumbing, Electrical, Carpentry, Blacksmithing, Painting, HVAC, Tiling & Flooring, General Maintenance)

---

## Milestone 2: Public Pages (SSR/SEO)

Build all guest-accessible, server-rendered pages with SEO optimization.

**Exit Criteria:** All public routes render server-side with proper SEO markup. Guests can browse providers, categories, and requests without authentication.

### Tasks

- [x] 2.1 — Build landing page (`/`) with search bar, top categories grid, and featured providers section
- [x] 2.2 — Build categories listing page (`/categories`) showing all trade categories with icons/images
- [x] 2.3 — Build category detail page (`/categories/[slug]`) with providers and listings filtered by city (Amman, Irbid, Zarqa)
- [x] 2.4 — Build provider profile page (`/providers/[id]`) with bio, portfolio gallery, services list, and reviews
- [x] 2.5 — Build open requests listing page (`/requests`) browsable by category and city
- [x] 2.6 — Build single request detail page (`/requests/[id]`) with description, photos, budget, and quote count
- [x] 2.7 — Build about page (`/about`) with platform information
- [x] 2.8 — Implement dynamic `<title>`, `<meta description>`, and Open Graph tags for all public pages
- [x] 2.9 — Add JSON-LD structured data: LocalBusiness schema on provider profiles, Service schema on listings
- [x] 2.10 — Generate sitemap for all public routes
- [x] 2.11 — Implement clean URL slugs for categories (`/categories/plumbing` not `/categories/123`)
- [x] 2.12 — Add canonical URLs to all public pages

---

## Milestone 3: Provider Profile & Service Management

Allow authenticated providers to create/edit their profile and manage service listings.

**Exit Criteria:** Providers can fully manage their profile and service listings. Provider data appears on public profile pages.

### Tasks

- [x] 3.1 — Build provider profile edit page (`/dashboard/profile`) with fields: display name, avatar upload, bio (max 500 chars), trade categories (multi-select), service area (city picker)
- [x] 3.2 — Build portfolio management UI: upload photos with captions, reorder, delete
- [x] 3.3 — Write Convex mutations for creating/updating provider profile
- [x] 3.4 — Build service listing CRUD page (`/dashboard/services`): create, edit, delete services
- [x] 3.5 — Service form: title, description, category select, price type (fixed/flexible), price in JOD
- [x] 3.6 — Write Convex mutations for service CRUD (create, update, delete)
- [x] 3.7 — Write Convex queries to fetch provider profile with services, portfolio, and computed rating
- [x] 3.8 — Image upload and compression pipeline for avatar and portfolio photos via Convex file storage
- [x] 3.9 — Validate that provider profile is complete before services appear in public search

---

## Milestone 4: Service Requests & Quoting

Enable customers to post requests and providers to submit quotes.

**Exit Criteria:** Full request-to-quote flow works end-to-end. Accepted quotes transition into jobs.

### Tasks

- [x] 4.1 — Build "Post a Request" form: title, description, category select, city select, budget min/max, photo upload (optional)
- [x] 4.2 — Write Convex mutation for creating a service request
- [x] 4.3 — Build customer's "My Requests" page (`/dashboard/requests`) listing posted requests with status
- [x] 4.4 — Build provider's "Browse Requests" view showing open requests filtered by city and category matching provider's profile
- [x] 4.5 — Build quote submission form: price (JOD), estimated duration, message
- [x] 4.6 — Write Convex mutation for submitting a quote (validate: one quote per provider per request)
- [x] 4.7 — Build request detail view for customers showing all received quotes with provider info
- [x] 4.8 — Implement accept/reject quote actions for customers
- [x] 4.9 — Write Convex mutation: accepting a quote creates a job record and marks request as "assigned"
- [x] 4.10 — Write Convex mutation: allow providers to withdraw their quote
- [x] 4.11 — Write Convex queries for request listing with filters (city, category, status)

---

## Milestone 5: Job Lifecycle & Status Management

Implement the complete job state machine and job detail page.

**Exit Criteria:** Jobs progress through all states correctly. Both customers and providers see appropriate actions at each stage.

### Tasks

- [x] 5.1 — Define job status enum: requested, quoted, accepted, in_progress, completed, confirmed, reviewed, cancelled, disputed
- [x] 5.2 — Write Convex mutation for job state transitions with validation (enforce valid transitions only)
- [x] 5.3 — Build job detail page (`/dashboard/jobs/[id]`) showing: status badge, job info, provider/customer info, timeline of status changes, and action buttons
- [x] 5.4 — Implement "Mark as In Progress" action (either party can trigger, only from accepted state)
- [x] 5.5 — Implement "Mark as Complete" action (provider only, from in_progress state)
- [x] 5.6 — Implement "Confirm Completion" action (customer only, from completed state)
- [x] 5.7 — Implement "Cancel Job" action (either party, only before in_progress state)
- [x] 5.8 — Implement "Raise Dispute" action (either party, from in_progress or completed state)
- [x] 5.9 — Build jobs listing page (`/dashboard/jobs`) with tabs: active jobs, past jobs
- [x] 5.10 — Implement direct hire flow: customer sends request directly to a specific provider from their profile page, creating a job in "requested" state
- [x] 5.11 — Write Convex query for job detail with all related data (request, quote, provider, customer, messages)

---

## Milestone 6: Real-Time Chat

Build job-scoped real-time messaging.

**Exit Criteria:** Real-time chat works within job context. Messages persist and images can be shared.

### Tasks

- [ ] 6.1 — Define messages table schema: jobId, senderId, content (text), imageId (optional), createdAt
- [ ] 6.2 — Write Convex mutation for sending a text message (validate: user is part of the job, job is in a chat-eligible state)
- [ ] 6.3 — Write Convex mutation for sending an image message via file storage
- [ ] 6.4 — Write Convex real-time query (subscription) for fetching messages by jobId, ordered by createdAt
- [ ] 6.5 — Build chat UI component within job detail page: message list with auto-scroll, text input, image upload button, send button
- [ ] 6.6 — Implement chat access control: chat unlocked only after quote submitted or direct request sent
- [ ] 6.7 — Display sender avatar, name, and timestamp on each message
- [ ] 6.8 — Handle image preview and full-size view in chat

---

## Milestone 7: Reviews & Ratings

Allow customers to review providers after job completion.

**Exit Criteria:** Review flow works end-to-end. Provider ratings are computed and visible on public profiles.

### Tasks

- [ ] 7.1 — Build review form: star rating (1–5), text comment, shown after customer confirms job completion
- [ ] 7.2 — Write Convex mutation for submitting a review (validate: one review per job, only by customer, only after confirmed state)
- [ ] 7.3 — Write Convex query to compute provider average rating and review count
- [ ] 7.4 — Display reviews list on provider public profile page (`/providers/[id]`) with rating, comment, reviewer name, and date
- [ ] 7.5 — Build reviews dashboard page (`/dashboard/reviews`): reviews received (provider view), reviews given (customer view)
- [ ] 7.6 — Update job status to "reviewed" after review submission
- [ ] 7.7 — Build star rating display component (read-only and interactive versions)

---

## Milestone 8: Dashboard

Build the role-aware authenticated dashboard.

**Exit Criteria:** Dashboard renders correct views based on user role. All management actions accessible from dashboard.

### Tasks

- [ ] 8.1 — Build dashboard layout with sidebar/nav: role-aware menu items (customer vs provider sections)
- [ ] 8.2 — Build dashboard home page (`/dashboard`) with summary cards: active jobs count, pending quotes, unread messages, recent activity
- [ ] 8.3 — Customer dashboard view: my requests summary, active jobs, recent reviews given
- [ ] 8.4 — Provider dashboard view: my services summary, new requests matching my profile, active jobs, recent reviews received
- [ ] 8.5 — Implement role toggle: allow a single account to switch between customer and provider views
- [ ] 8.6 — Build responsive dashboard layout (sidebar collapses to bottom nav on mobile)
- [ ] 8.7 — Add empty states and onboarding prompts (e.g., "Complete your provider profile to start receiving jobs")

---

## Milestone 9: Premium & Monetization

Implement premium ad placements and priority visibility boosts.

**Exit Criteria:** Providers can purchase visibility boosts. Boosted providers rank higher and display premium badges.

### Tasks

- [ ] 9.1 — Define premium_orders table schema: providerId, type (ad/visibility_boost), duration (7/30 days), startDate, endDate, status
- [ ] 9.2 — Build premium purchase page (`/dashboard/premium`) with plan options and pricing
- [ ] 9.3 — Write Convex mutation for creating a premium order (manual activation by admin for MVP)
- [ ] 9.4 — Implement priority ranking: boosted providers appear first in category/search results
- [ ] 9.5 — Add premium badge component displayed on provider cards and profile pages
- [ ] 9.6 — Build premium ad banner/card components for category pages and homepage
- [ ] 9.7 — Write Convex scheduled function to expire premium orders after their duration ends
- [ ] 9.8 — Write Convex query to check active premium status for a provider

---

## Milestone 10: Push Notifications & PWA Polish

Configure push notifications and finalize PWA.

**Exit Criteria:** Push notifications deliver reliably. App is installable and meets PWA requirements.

### Tasks

- [ ] 10.1 — Set up Web Push API: generate VAPID keys, implement subscription flow in the client
- [ ] 10.2 — Write Convex mutation to store push subscription per user
- [ ] 10.3 — Write Convex scheduled functions to send push notifications on events: new quote received, quote accepted/rejected, new chat message, job status change
- [ ] 10.4 — Build notification permission prompt UI (ask user to allow notifications)
- [ ] 10.5 — Implement service worker for offline shell caching and static asset caching
- [ ] 10.6 — Test PWA installability on Android and iOS
- [ ] 10.7 — Add "Install App" prompt/banner for mobile users
- [ ] 10.8 — Handle notification click: deep-link to the relevant job/chat page

---

## Milestone 11: Search, Filtering & Performance

Implement search, filtering, and performance optimization.

**Exit Criteria:** Search and filters work accurately. Performance targets met on key pages.

### Tasks

- [ ] 11.1 — Implement full-text search on providers (name, bio, services) using Convex search indexes
- [ ] 11.2 — Implement full-text search on service listings (title, description)
- [ ] 11.3 — Build search results page with combined provider and service results
- [ ] 11.4 — Add filters on category pages: city, price range, minimum rating
- [ ] 11.5 — Add filters on requests page: city, category, budget range
- [ ] 11.6 — Implement image compression/resizing on upload (before storing in Convex)
- [ ] 11.7 — Optimize public pages for LCP < 2.5s: lazy-load images, optimize server component data fetching
- [ ] 11.8 — Ensure real-time chat latency < 500ms under normal load
- [ ] 11.9 — Add loading skeletons for all data-fetching pages

---

## Milestone 12: QA, Accessibility & Launch Prep

End-to-end testing, accessibility audit, security review, and deployment.

**Exit Criteria:** All critical flows pass QA. Accessibility and security checks pass. App deployed to production.

### Tasks

- [ ] 12.1 — Test Flow 1 end-to-end: provider sign-up → profile → list services → appear in search → receive direct hire
- [ ] 12.2 — Test Flow 2 end-to-end: customer sign-up → post request → receive quotes → accept quote → job created
- [ ] 12.3 — Test Flow 3 end-to-end: job lifecycle through all states (accepted → in progress → completed → confirmed → reviewed)
- [ ] 12.4 — Test Flow 4: real-time chat with text and image sharing within a job
- [ ] 12.5 — Test cancellation and dispute flows
- [ ] 12.6 — WCAG 2.1 AA compliance audit: focus management, color contrast, screen reader labels, keyboard navigation
- [ ] 12.7 — RTL layout verification across all pages (text alignment, element ordering, icons)
- [ ] 12.8 — Security review: validate auth tokens (httpOnly cookies), input sanitization on all forms, rate limiting on quote/request submissions
- [ ] 12.9 — Cross-browser testing (Chrome, Safari, Firefox) and mobile device testing
- [ ] 12.10 — Configure Vercel production deployment: environment variables, domain, Convex production instance
- [ ] 12.11 — Final performance audit: Lighthouse scores on all public pages
- [ ] 12.12 — Smoke test on production after deployment
