# MONOCASH: Master Development Blueprint

## 1. Project Identity & Architecture
*   **App Name:** MonoCash
*   **Role:** Offline-first personal finance tracker & planner.
*   **Tech Stack:** React Native (Expo), TypeScript (Strict), Zustand (State Management), NativeWind (Tailwind CSS), Expo SQLite (Local DB), **React Native Reanimated (for 60fps smooth UI transitions)**.
*   **Visual Identity:** 100% Monochrome. Background: `#000000`, Text/Action: `#FFFFFF`, Borders/Muted: `#333333`. Strict `monospace` typography for all text.
*   **Clean Code Constraints:** Strictly separate Presentation (UI/components) from Business Logic (hooks/Zustand). Use `camelCase` for variables/functions, `PascalCase` for components/types/interfaces.
*   **Animation Guidelines:** All UI interactions (modal opening, tab switching, adding/removing list items) MUST use smooth, subtle animations via `react-native-reanimated` or `LayoutAnimation`. Avoid janky React state-based conditional rendering without transitions.

## 2. Core Entities (TypeScript Interfaces in src/types/index.ts)
*   **Kantong:** `id`, `name`, `balance` (number), `createdAt`, `updatedAt`.
*   **Transaksi:** `id`, `kantongId`, `amount`, `type` ('INCOME' | 'EXPENSE'), `description`, `date` (ISO 8601), `createdAt`.
*   **Tagihan (Dynamic Bills):** `id`, `title`, `amount`, `dueDate` (ISO 8601), `isRecurring` (boolean), `frequency` ('WEEKLY' | 'MONTHLY' | 'YEARLY' | null), `isPaid` (boolean), `createdAt`.
*   **Wishlist:** `id`, `title`, `description`, `price`, `imageUrl` (local URI string), `purchaseLink`, `isAchieved` (boolean), `createdAt`.

## 3. Master Sprint Roadmap

### Sprint 1: Data Layer & Core Engine
*   **Goal:** Establish local-first database and memory state.
*   **Tasks:** 
    1. Scaffold folder structure (`assets`, `components`, `constants`, `db`, `hooks`, `screens`, `store`, `types`, `utils`).
    2. Define strict TypeScript interfaces.
    3. Setup `expo-sqlite` and write CRUD queries for `Kantong` and `Transaksi`.
    4. Setup Zustand store (`useFinanceStore`) to sync SQLite data to UI state. Automatically update `Kantong` balance when a `Transaksi` is added.

### Sprint 2: UI Dashboard & Envelope Management
*   **Goal:** Build the primary interface to view and manage assets.
*   **Tasks:** 
    1. Global monochrome theme configuration.
    2. Dashboard Screen: Show total aggregated balance from all `Kantong`.
    3. Form UI to add/edit `Kantong`.
    4. Form UI to input Income/Expense, updating Zustand state immediately.

### Sprint 3: Dynamic Bills & Reminders (Tagihan)
*   **Goal:** Track recurring (e.g., WiFi, Ortu) and one-off (e.g., PayLater) bills.
*   **Tasks:** 
    1. SQLite queries and Zustand store for `Tagihan`.
    2. Bills Screen UI showing upcoming deadlines based on `dueDate`.
    3. Logic to calculate days remaining and visually warn (e.g., bold/inverted colors) if overdue or unpaid.

### Sprint 4: Visual Wishlist & Zero-Based Budgeting
*   **Goal:** Motivation tracker and budget allocation.
*   **Tasks:** 
    1. SQLite and Zustand logic for `Wishlist`.
    2. Wishlist Grid UI with local image caching (handling device gallery URIs).
    3. Savings Goals UI (progress bar comparing specific `Kantong` balance vs Goal amount).

### Sprint 5: Utility & Export
*   **Goal:** Prevent vendor lock-in and enable external analysis.
*   **Tasks:** 
    1. Implement `.xlsx` export parsing SQLite tables into a spreadsheet file.
    2. Enable local device sharing/saving of the generated file.
