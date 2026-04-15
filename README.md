# Hasab AI Dashboard - Frontend

Next-generation AI content processing dashboard built with Next.js, Shadcn UI, and TanStack Query.

---

## Table of Contents
- [Architecture & Rules](#architecture--rules)
- [Project Structure](#project-structure)
- [Technical Stack](#technical-stack)
- [Design System](#design-system)
- [Getting Started](#getting-started)

---

## Architecture & Rules

To ensure a scalable and maintainable codebase, all developers **MUST** follow these rules:

### 1. State Management Strategy
- **React Query (Server State)**: Use for all data fetching, caching, and synchronization with the server (e.g., jobs, history, user profiles, API data).
- **Zustand (UI State ONLY)**: Use for global UI-only updates where React state isn't enough (e.g., modal open/close states, file preview toggles, local pipeline progress).

### 2. Feature-Driven Development
Every major feature must be broken down into a structured sub-directory in `src/features/` with a consistent internal structure (see Project Structure for details).

### 3. Componentization
- Pages should be lean entry points that orchestrate components.
- Complex UIs (like Transcription or Meeting Minutes) must be broken into small, reusable components.
- Use the central `FormProvider` (Zod + React Hook Form) for all form logic.

### 4. Development Workflow
- **Small PRs Only**: Break down tasks into small, reviewable chunks.
- **Environment Variables**: Always use `process.env.NEXT_PUBLIC_API_URL` etc. Never hardcode endpoints.

## Architecture & Rules

To ensure a scalable and maintainable codebase, all developers **MUST** follow these rules:

---

### 1. State Management Strategy
- **React Query (Server State)**: Use for all data fetching, caching, and synchronization with the server (e.g., jobs, history, user profiles, API data).
- **Zustand (UI State ONLY)**: Use for global UI-only updates where React state isn't enough (e.g., modal open/close states, file preview toggles, local pipeline progress).

---

### 2. Feature-Driven Development
Every major feature must be broken down into a structured sub-directory in `src/features/` with a consistent internal structure (see Project Structure for details).

---

### 3. Componentization
- Pages should be lean entry points that orchestrate components.
- Complex UIs (like Transcription or Meeting Minutes) must be broken into small, reusable components.
- Use the central `FormProvider` (Zod + React Hook Form) for all form logic.

---

### 4. Development Workflow
- **Small PRs Only**: Break down tasks into small, reviewable chunks.
- **Environment Variables**: Always use `process.env.NEXT_PUBLIC_API_URL` etc. Never hardcode endpoints.

---

### 5. Design System Enforcement 

To maintain UI consistency and scalability, all styling must follow the centralized design system.

#### Color Rules
- ❌ Never use raw Tailwind color classes  
  - e.g. `text-red-500`, `bg-blue-200`, `border-gray-300`

- ✅ Always use design system tokens (shadcn / CSS variables)  
  - e.g.:
    ```tsx
    className="text-primary bg-background border-border"
    ```

---

#### Typography Rules
- ❌ Never hardcode text sizes in components  
  - e.g. `text-sm`, `text-lg`, `text-xl`

- ✅ Use globally defined typography styles from `globals.css`
  - Typography must be controlled centrally for:
    - responsive design (mobile vs desktop)
    - consistency across the application

---

#### Semantic Typography (Required)
All text styles should use semantic utility classes defined in `globals.css`.

Example:
```css
.text-heading {
  @apply text-2xl md:text-3xl font-semibold;
}

.text-body {
  @apply text-base;
}

.text-caption {
  @apply text-sm text-muted-foreground;
}
```

## Project Structure

```text
src/
├── app/                        # Next.js App Router
│   ├── (marketing)/            # Public pages (/, /pricing, /about)
│   ├── (auth)/                 # Auth pages (/login, /register)
│   ├── dashboard/              # Dashboard pages & layouts
│   │   ├── playground/         # Interactive tools (transcription, tts, etc.)
│   │   ├── history/            # User processing history
│   │   └── (settings)/         # Profile, Billing, Settings
│   └── layout.tsx              # Root app layout
│
├── features/                   # Core business logic (feature-sliced)
│   ├── [feature-name]/         # e.g., transcription, translation, tts
│   │   ├── components/         # Feature-specific UI components
│   │   ├── config/             # Configuration-driven logic (endpoints, limits, UI labels)
│   │   ├── hooks/              # Custom hooks and TanStack Query wrappers
│   │   ├── schemas/            # Zod validation schemas for forms and API requests
│   │   └── types/              # TypeScript interfaces and types
│
├── components/                 # Global UI components
│   ├── ui/                     # shadcn-ui (Radix-based)
│   ├── layout/                 # Header, Sidebar, Navbar
│   ├── common/                 # PageHeader, Loading, EmptyState
│   └── forms/                  # FormProvider, InputField, FileUploader
│
├── lib/                        # Shared utilities & configurations
│   ├── api-client.ts           # Base URL and Axios/fetch client configuration
│   ├── auth.ts                 # Authentication-related helpers and logic
│   ├── constants.ts            # Application-wide constant values
│   ├── react-query/            # QueryClient & key definitions
│   ├── utils.ts                # General-purpose utility functions
│   └── zod/                    # Zod validation helpers
│
├── store/                      # Global UI state management (Zustand)
│   ├── auth.store.ts           # Auth status and user session (UI only)
│   ├── transcription.store.ts  # Transcription pipeline local state
│   ├── meeting.store.ts        # Meeting minutes UI state
│   ├── subtitle.store.ts       # Subtitle editor local state
│   └── ui.store.ts             # Sidebar, modals, and global UI toggles
│
├── hooks/                      # Global reusable hooks
│   ├── use-mobile.ts           # Device detection and responsive layout hook
│   ├── useAuth.ts              # Global authentication context wrapper
│   ├── useDebounce.ts          # Value debouncing for search and inputs
│   └── useLocalStorage.ts      # Synchronized local storage management
│
├── types/                      # Global TypeScript types
│   ├── common.types.ts         # Global reusable interfaces and types
│   └── api.types.ts            # Generic API response and request types
│
├── styles/                     # Global CSS & Tailwind config
└── utils.ts                    # High-level shared utilities
```

### Feature Directory Descriptions

| Directory | Purpose |
| :--- | :--- |
| **components/** | UI components that are unique to this feature (e.g., `TranscriptionUploader`). |
| **config/** | Centralized configuration for the feature, such as allowed file types or UI text. |
| **hooks/** | Custom hooks that encapsulate feature logic or wrap TanStack Query (e.g., `useTranscription`). |
| **schemas/** | Zod schemas used for form validation and type safety. |
| **types/** | Type definitions and interfaces specific to the feature's data structures. |

---

## Technical Stack
- **Framework**: Next.js (App Router)
- **UI Architecture**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query (Server), Zustand (UI)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

---

## Design System

### Colors & Gradients
The application uses a primary brand gradient:
- **Gradient**: `bg-gradient-to-tr from-[#7C20D0] to-[#D020C9]`  or `primary-gradient`
- **Primary Color Variable**: `#7C20D0`

### Typography Standards
- **Font**: Inter (Sans-serif)
- **Sizing Hierarchy**:
    - **H1 (Page Headers)**: `text-3xl font-bold`
    - **H2 (Section Headers)**: `text-2xl font-semibold`
    - **Markdown/Body**: `text-base leading-relaxed`
    - **Small/Span**: `text-sm text-muted-foreground`

---

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Setup environment variables**:
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_API_URL=https://api.hasab.ai/v1
   ```

3. **Run the development server**:
   ```bash
   pnpm run dev
   ```
