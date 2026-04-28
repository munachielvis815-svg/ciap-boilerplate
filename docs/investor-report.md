# Creative Influence Analytics Platform (CIAP)
## Backend Engineering Progress Report — Investor Brief

**Prepared by:** Sammy Tha Dev, Backend Engineer
**Date:** April 2026

---

## What CIAP Is

The Creative Influence Analytics Platform is a data-driven platform that connects **brands and subject-matter experts (SMEs)** with the right **content creators** — people who drive real audience engagement on platforms like YouTube.

Rather than relying on gut feel or vanity metrics, CIAP gives SMEs and brands a structured, data-backed way to discover creators, evaluate their influence, and make informed partnership decisions. Creators, in turn, get a dashboard that shows them how their content is performing across key dimensions.

The platform is being built API-first, meaning the backend serves as the core engine that powers any future web app, mobile app, or third-party integration built on top of it.

---

## Progress to Date

### ✅ The Platform Is Live and Accessible

The backend API is deployed and running. A full interactive API reference is available at [ciap-proxy.onrender.com/api-docs](https://ciap-proxy.onrender.com/api-docs), documenting every endpoint, data structure, and authentication requirement.

---

### ✅ Secure User Accounts and Login

Users can sign up, log in, and manage their sessions securely. The platform supports:

- **Email and password login** for all user types
- **Google Sign-In** — users can authenticate with their existing Google account, reducing signup friction
- **Secure session management** — login sessions are tracked and can be revoked (e.g. on logout or device change), preventing unauthorised access even if a token is intercepted

Admin accounts are separately protected and cannot be created by ordinary users.

---

### ✅ Multi-Tenant Architecture

CIAP is built to support **multiple organisations on the same platform** from day one — a critical capability for scaling to agencies, brand teams, and enterprise clients.

Each organisation (tenant) operates in its own isolated space. Users, creators, and data within one organisation are not visible to another. Administrators have a global view for platform management, while regular users and SMEs are scoped to their own organisation.

This means CIAP can onboard new customers without rebuilding infrastructure — a foundation ready for B2B commercial growth.

---

### ✅ Four Distinct User Roles

The platform supports four types of users, each with tailored access and capabilities:

| Role | Who They Are | What They Can Do |
|---|---|---|
| **Admin** | Platform operators | Manage users across all organisations |
| **Creator** | Content creators (e.g. YouTubers) | Connect their channels, view their own analytics |
| **SME** | Subject-matter experts / brands | Discover, search, and compare creators |
| **User** | General platform users | Access their own profile and data |

Permissions are enforced at every level — a creator cannot see another creator's data, and an SME cannot access admin functions.

---

### ✅ YouTube Data Ingestion Pipeline

This is the core of CIAP's analytics capability. When a creator connects their YouTube channel:

1. The platform **securely connects** to their YouTube account via Google's official OAuth2 authorisation (the creator explicitly grants permission)
2. CIAP **pulls their channel data** — subscriber count, total views, video catalogue, and detailed analytics (watch time, engagement, audience demographics) for up to the last 90 days
3. The data is **stored and processed** in the platform's database for ongoing analysis
4. An **influence scoring job** is automatically queued to compute the creator's influence score

This pipeline turns raw YouTube data into structured, comparable creator profiles — the foundation of the SME discovery and matching experience.

---

### ✅ Creator Analytics Dashboard (for Creators)

Creators logged into CIAP can access three analytics views:

- **Audience Insights** — who is watching their content
- **Content Insights** — which content performs best
- **Performance Insights** — overall channel performance trends

This gives creators a reason to join and stay on the platform — they get value back in exchange for connecting their channel data.

---

### ✅ Creator Discovery Tools (for SMEs and Brands)

SMEs and brands have a dedicated discovery surface:

- **Discovery feed** — surface relevant creators
- **Search** — filter creators by category, niche, bio, and other criteria
- **Creator profiles** — deep-dive view of a single creator's data
- **Compare** — side-by-side comparison of multiple creators

This is the primary commercial value proposition for the SME/brand side of the marketplace.

---

### ✅ Data Infrastructure

The platform's data layer is built on **PostgreSQL** — a battle-tested, enterprise-grade relational database used by companies like Instagram, Spotify, and Airbnb. The schema covers:

- User accounts and organisation membership
- Creator profiles and influence scores
- Content catalogues and performance metrics
- Session and security event history
- YouTube channel data and approval workflows

The data model is designed to expand to additional platforms (TikTok, Instagram, LinkedIn) without restructuring.

---

### ✅ Production-Ready Engineering Standards

The platform is not a prototype — it has been built to production standards from the start:

- **Security hardened** — industry-standard encryption for all tokens, no sensitive data exposed in error messages, security headers on every response, full audit trail of auth events
- **Scalable job processing** — background jobs (e.g. influence scoring) are handled via a dedicated queue system, meaning heavy processing does not block the API
- **Containerised** — the entire stack runs in Docker, making deployment consistent across environments
- **Observable** — structured logging with configurable log levels and formats for production monitoring
- **Developer-friendly** — full API documentation auto-generated from code, fast build tooling, automated code quality checks

---

## What This Means for the Business

| Capability | Business Value |
|---|---|
| Multi-tenant architecture | Can onboard multiple brand/agency clients without rebuilding |
| Google OAuth + YouTube ingestion | Frictionless creator onboarding; real data from day one |
| Role-based access (4 roles) | Product works for creators, SMEs, brands, and platform admins |
| Creator discovery + comparison | Core SME/brand use case is functional |
| Influence scoring pipeline | Quantifiable, comparable creator metrics for brand decisions |
| Production-grade security | Enterprise client and data privacy requirements met |

---

## What's Next

The immediate priorities for the next development phase are:

1. **Expand platform coverage** — bring in TikTok and Instagram data alongside YouTube
2. **Improve creator discovery** — integrate a search engine for faster, smarter creator matching at scale
3. **Protect against abuse** — add rate limiting on login and auth endpoints
4. **Test coverage** — expand automated testing across authentication and data ingestion flows
5. **More sign-in options** — allow creators to sign in with Apple or X (Twitter) in addition to Google

---

## Summary

In the current phase, the CIAP backend has delivered a **fully functional, secure, multi-tenant API** that can authenticate users, ingest real creator data from YouTube, compute influence scores, and surface that data to both creators and SMEs through role-appropriate interfaces. The technical foundation is solid, scalable, and ready to support product development, partnerships, and commercial onboarding.
