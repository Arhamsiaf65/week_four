# Project Guide — Architecture & Dependencies

This file explains the project's key dependencies, how they're used, and a concise walkthrough of the main pages (`LoginPage`, `RegisterPage`, `DashboardPage`). The goal: make it easy to work on this codebase if you only know React.

---

## High-level architecture

- React + TypeScript SPA bootstrapped with Vite.
- Tailwind CSS for styling, with additional CSS variables in `src/index.css` to centralize theme tokens (gold, burgundy, surface colors).
- `src/features/*` contains feature areas (auth, dashboard).
- `services/axios.ts` exports a configured axios instance for API calls.
- Global small app state (auth token, toasts) stored with `zustand` in `useAuthStore`.
- Data fetching & server-state (requests, caching, mutations) handled with `@tanstack/react-query`.
- Forms are built with `react-hook-form` and validated using `zod` via `@hookform/resolvers/zod`.
- Icons from `lucide-react`.

---

## Why these dependencies and how they are used

- React (obvious): UI library.

- react-router-dom
  - Purpose: client-side routing (pages like `/login`, `/register`, `/dashboard`).
  - How used: `useNavigate`, `Link` components in pages to navigate programmatically and link between routes.

- axios
  - Purpose: HTTP client to call the backend API.
  - How used: `services/axios.ts` exports a configured instance (base URL, interceptors) used by React Query mutation functions and other services.

- @tanstack/react-query (React Query)
  - Purpose: declarative server state management — caching API responses, tracking loading/error states, and running mutations.
  - How used: `useQuery` to load `me` and `users`; `useMutation` for login, register, create/update/delete users. React Query provides `isPending`/`isLoading`, caching, and `invalidateQueries` to refresh cached data after mutations.
  - Benefit: you don't have to manually manage loading/error states and re-fetching; React Query does that safely and efficiently.

- react-hook-form
  - Purpose: performant form state handling with simple APIs and minimal re-renders.
  - How used: `useForm()` returns `register`, `handleSubmit`, and `formState.errors` used in `LoginPage`/`RegisterPage`/modal forms.
  - Benefit: simpler than controlled inputs; integrates well with validation resolvers.

- zod + @hookform/resolvers/zod
  - Purpose: schema-based validation.
  - How used: define a `loginSchema`/`registerSchema` in `schemas/authSchemas.ts`. Pass `zodResolver(schema)` into `useForm` to validate on submit automatically. `errors` contain typed messages for fields.

- zustand
  - Purpose: tiny global state (auth token, toast messages) without Redux complexity.
  - How used: `useAuthStore` holds `accessToken`, `isAuthenticated`, and `toast`. Components call `setAccessToken` on login and `showToast` to display messages.

- lucide-react
  - Purpose: lightweight SVG icon components.
  - How used: import icons like `Mail`, `Lock`, `Trash2`, and use them directly in JSX (props control size and color classes).

- Tailwind CSS (and project CSS)
  - Purpose: utility-first styling; `src/index.css` defines CSS variables and custom utilities for theme tokens and components like `.brand-logo`, `.btn-primary`, `.btn-danger`, and `.input-field`.
  - How used: prefer theme utilities (e.g., `bg-surface`, `text-slate-100`, `border-surface`) instead of scattered `bg-white` or `text-slate-900`. This centralizes colors.

---

## Key files walkthrough

- `src/index.css`
  - Central theme variables (e.g., `--color-burgundy-900`, `--color-gold-400`, `--color-surface`) and utilities.
  - Contains `.brand-logo` used for the header, and reusable component classes (`.btn-primary`, `.btn-danger`, `.input-field`) to avoid duplicated long class strings.

- `src/services/axios.ts`
  - A single axios instance is configured for base URL and request/response interceptors. Use this instance for all API calls so auth headers and error handling are consistent.

- `src/features/auth/store/authStore.ts`
  - `zustand` store that keeps `accessToken`, `isAuthenticated`, and toast helpers. Login/Register flows call `setAccessToken` on success.

- `src/features/auth/pages/LoginPage.tsx` and `RegisterPage.tsx`
  - Use `react-hook-form` + `zod` for form handling and validation.
  - On submit, call a React Query `useMutation` that invokes `api.post(...)` via the axios instance.
  - On success: store token in `useAuthStore`, call `queryClient.invalidateQueries(['me'])` to refresh user info, show a toast, then navigate to `/dashboard`.

- `src/features/dashboard/pages/DashboardPage.tsx`
  - Protected admin area UI.
  - Uses `useQuery` to fetch `users` and `me` (current user).
  - Several `useMutation` hooks for create/update/delete actions; they invalidate and refetch the `users` query on success.
  - Uses modals implemented directly in JSX to create/edit/delete users. Buttons use the `.btn-primary` and `.btn-danger` utilities added in `index.css`.

---

## How to add a new form with validation (quick recipe)

1. Create a Zod schema:

```ts
import { z } from 'zod';
export const myFormSchema = z.object({
  title: z.string().min(3),
  qty: z.number().int().positive(),
});
export type MyForm = z.infer<typeof myFormSchema>;
```

2. Use `react-hook-form` with the resolver:

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<MyForm>({ resolver: zodResolver(myFormSchema) });

<form onSubmit={handleSubmit((data) => mutation.mutate(data))}>...
```

3. Use a React Query `useMutation` to call the API and `queryClient.invalidateQueries` to refresh relevant data.

---

## Tips for maintaining a clean codebase (senior advice)

- Centralize shared styling and tokens in `src/index.css` so changing a color only needs one edit.
- Extract repeating UI chunks (modals, form controls, table rows) into small components to reduce duplication and improve readability.
- Keep `useMutation` calls colocated with forms that use them; keep `useQuery` calls near views that render the results.
- Prefer `react-hook-form` for complex forms and `zod` for type-safe validation.
- Use the `useAuthStore` for small app-level pieces only (auth data, simple toasts). For larger global state, consider splitting stores or using React Query's cache for server state.

---

If you'd like, I can now:
- Extract repeated modal markup into small components (e.g., `ConfirmDialog`, `UserFormModal`).
- Replace remaining duplicated patterns across the repo.
- Add a short `CONTRIBUTING.md` with developer commands and how to run the app locally.

Tell me which next step you'd like me to take and I'll implement it.
