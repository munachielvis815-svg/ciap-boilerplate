# CIAP Frontend (Creator Intelligence & Analytics Platform)

Welcome to the frontend of the **CIAP Platform**, a high-fidelity analytics and discovery engine built for the African creator economy. This application provides creators with deep insights into their performance and allows brands (SMEs) to discover and compare influencers using data-driven metrics.

## 🚀 Key Features

*   **Unified Creator Studio**: A central hub for creators to see their total reach, influence score, and loyalty metrics across platforms.
*   **Deep YouTube Integration**: Real-time ingestion of channel stats, video engagement, and daily analytics (views, watch time, etc.).
*   **Role-Based Dashboards**: 
    *   **Creators**: Focus on personal growth and account management.
    *   **SME/Agencies**: Focus on market discovery, creator search, and campaign forecasting.
*   **Modern Studio Aesthetic**: A premium "Retro-Modern" design featuring bold borders, tactile shadows, and vibrant pastel palettes.
*   **Influence Scoring**: AI-driven scores calculated based on engagement, growth, and audience resonance.

## 🛠 Tech Stack

*   **Core**: [Next.js 16 (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
*   **Icons**: [@phosphor-icons/react](https://phosphoricons.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Charts**: [Recharts](https://recharts.org/)

## 📂 Directory Structure

```text
frontend/
├── app/                  # Next.js App Router (File-based routing)
│   ├── (auth)/           # Authentication flows (Login, Signup)
│   ├── (protected)/      # Gated features (Dashboard, Discovery)
│   └── layout.tsx        # Global providers and layout shell
├── components/           # UI Component Library
│   ├── layout/           # Shared layout parts (Sidebar, Topbar, Nav)
│   └── shared/           # Atomic UI elements (Buttons, Cards, Inputs)
├── lib/                  # Core Logic & Utilities
│   ├── api/              # Axios client and React Query hooks
│   ├── auth/             # Session and role management (Zustand)
│   └── utils.ts          # Styling and helper functions
├── public/               # Static Assets (Logos, Undraw illustrations)
├── types/                # Global TypeScript interfaces
└── hooks/                # Custom React hooks
```

## ⚙️ Setup & Development

1.  **Clone & Install**:
    ```bash
    pnpm install
    ```
2.  **Environment Variables**:
    Create a `.env.local` file:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:3000
    ```
3.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
    The app will be available at `http://localhost:4000`.

## 🎨 Design Philosophy

We follow the **"Modern Studio"** design system:
- **Borders**: 2px solid black (`border-2 border-black`).
- **Rounding**: Heavy rounding for a friendly yet professional feel (`rounded-[2.1rem]`).
- **Shadows**: Hard, tactile shadows (`shadow-xl shadow-black/5`).
- **Typography**: `Bricolage Grotesque` for a bold, editorial look.
- **Micro-interactions**: Subtle hover scales and transitions via Framer Motion.

## 📈 Analytics Workflow

1.  **OAuth**: User connects YouTube via Google OAuth.
2.  **Ingestion**: Backend pulls metrics from YouTube APIs.
3.  **Normalization**: Data is processed into standardized metrics.
4.  **Visualization**: Frontend displays performance trends and audience demographics via interactive charts.

---
Built with ❤️ by the CIAP Team.
