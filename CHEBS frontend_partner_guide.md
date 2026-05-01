# Frontend Partner Guide: CIAP Platform

Welcome to the **CIAP (Creator Intelligence & Analytics Platform)** project! This document will help you get up to speed with the frontend architecture and how we build things here.

## 1. Project Vision
We are building a cross-platform analytics and influence intelligence platform for the Nigerian/African market.
- **Creators**: Connect their social accounts (YouTube, IG, TikTok) to see unified analytics and an "Influence Score".
- **SMEs/Agencies**: Discover creators, compare them, and forecast campaign ROI.

## 2. Technical Stack
We use a modern, high-performance stack:
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom "Modern Studio" design system.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (for simple, fast global state).
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest) (for syncing backend data).
- **Icons**: [@phosphor-icons/react](https://phosphoricons.com/)
- **Auth**: Custom JWT-based flow with persistence in Zustand.

## 3. Directory Structure
```text
frontend/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login, Signup, Onboarding (Unprotected)
│   ├── (protected)/      # Dashboard, Insights, Discovery (Requires Login)
│   │   ├── dashboard/    # Main role-based metrics view
│   │   ├── users/        # Admin management
│   │   └── endpoints/    # API Debugging/Tools
│   └── layout.tsx        # Root layout with fonts/providers
├── components/           # Reusable UI components
│   ├── layout/           # Navbar, Topbar, Sidebar, MobileNav
│   └── shared/           # Buttons, Cards, Inputs, Theme wrappers
├── lib/                  # Core logic
│   ├── api/              # Axios client and React Query hooks (hooks.ts)
│   ├── auth/             # Zustand store for session management (store.ts)
│   └── utils.ts          # Helper functions and Tailwind merging
├── public/               # Static assets (images, undraw illustrations)
└── types/                # TypeScript interfaces and DTOs
```

## 4. Key Concepts
### "Modern Studio" Aesthetic
We avoid generic designs. Our UI features:
- **1px or 2px solid black borders** on cards and buttons.
- **Aggressive rounding** (`rounded-[2.1rem]`, `rounded-full`).
- **Bricolage Grotesque** font for headings (via Google Fonts).
- **Sentence case** for all labels (e.g., "Sign up now" instead of "Sign Up Now").
- **Pastel backgrounds** (Pastel Blue, Pastel Pink, Pastel Yellow, Cream) to contrast with black borders.
- **Micro-Animations**: Hover states use `scale-105` and `active:scale-95` for tactile feedback.

### Authentication & Roles
Users are assigned roles: `creator`, `sme`, `agency`, or `admin`. 
- **Creator**: Can connect socials, view personal score, and content performance.
- **SME/Agency**: Access to "Market" discovery to find and filter creators by score/reach.
- **Admin**: Full access to user management and system health.
- Access is controlled via Next.js middleware and protected route groups `(protected)`.
- The `useAuthStore` hook provides the current user and session status.

### Data Flow & Integration
We communicate with a NestJS backend. 
- All API calls use the custom hooks in `lib/api/hooks.ts`.
- **Zustand** is the source of truth for the user session.
- **React Query** handles all caching and background synchronization for analytics.
- **OAuth Flow**: YouTube connection is handled via `/ingestion/youtube/oauth2` on the backend, which redirects the user through Google's consent screen.

## 5. Deployment & Pushing
We push changes to the centralized GitHub repository. 
- Ensure you run `pnpm build` before pushing to verify TypeScript and Next.js integrity.
- Follow the feature-branch naming convention: `feat/[feature-name]` or `fix/[bug-name]`.

If you have questions about a specific component, check the `components/` directory for examples of the design system in action!
