# Veda Brands — PRD

## Original Problem Statement
Build a premium branding & marketing agency website per the 6-part "Veda Brands V2" master blueprint. Luxury dark glassmorphism (#09090B / violet #7C3AED / cyan #22D3EE), Apple/Linear-level polish, full CMS, inquiry & lead capture with Resend email automation, JWT auth, floating Connect button, premium animations.

## Stack
- Backend: FastAPI + MongoDB (Motor), bcrypt + PyJWT cookie auth, Resend for transactional email
- Frontend: React (CRA) + React Router 7 + Tailwind + lucide-react + sonner

## User Choices
- Backend: FastAPI + MongoDB
- Scope: Option B — Full CMS + Admin + editors in iteration 1
- Email: Resend (`onboarding@resend.dev` sender until domain verified)
- Admin: Self-setup via `/admin/setup`
- Images: No stock placeholders — paste URLs in CMS

## What's Implemented (Feb 2026)
**Public site**
- Home (hero, stats counters, services, why-us, featured portfolio, process, testimonials, FAQ, final CTA)
- About (story, mission, vision, values, team)
- Services list + dynamic `/services/:slug` detail
- Portfolio list with search/filter + dynamic `/portfolio/:slug` case study
- Contact (inquiry form → DB + Resend confirmation + admin notification)
- Connect (Phone / WhatsApp / Email / Instagram / LinkedIn / Hours cards + embedded Google Map)
- Login (customer login + register)
- 404 page
- Sticky glass navbar with mobile menu
- Floating Connect button (global, animated)
- Lead capture popup (timed, dismissable, stored in DB, Resend welcome email)
- Glassmorphism design system, Outfit + Manrope fonts, mesh/blur ambient backgrounds, framer-motion-ready

**Admin CMS** (`/admin/*`)
- First-time admin setup at `/admin/setup` (auto-locks)
- Admin login at `/admin/login` (JWT httpOnly cookies, admin-only)
- Sidebar dashboard: Overview, Homepage, About, Services, Portfolio, Testimonials, FAQ, Team, Contact Info, Inquiries, Leads, Settings
- Full CRUD for: Services, Portfolio, Testimonials, FAQ, Team
- Singleton editors for: Homepage (hero, stats array, why-points, process), About (story/mission/vision/values), Contact (phone/whatsapp/email/socials/map), Settings (logo, meta, tagline)
- Inquiry management with status workflow + internal notes
- Lead list with delete

**Integrations**
- Resend transactional emails (welcome + inquiry confirmation + admin notification) — branded HTML shells
- JWT cookie auth (12h access + 7d refresh)

## Architecture Notes
- All admin write endpoints protected by `require_admin` dependency
- MongoDB indexes on `users.email`, plus `id` on all CMS collections
- Singleton documents use `id="singleton"` pattern
- Frontend uses `withCredentials: true` everywhere via shared axios instance

## Backlog (P1/P2)
- File/image uploads (object storage) — currently URL-paste only
- Customer dashboard (saved projects)
- Password reset flow
- Activity logs / audit trail
- Media library
- Analytics (GA, Clarity) integration screens
- Custom Resend domain (currently uses `onboarding@resend.dev` — Resend test mode only delivers to verified addresses)
- Blog / case studies / careers
- PDF exports for inquiries
