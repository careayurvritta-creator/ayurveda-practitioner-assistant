# Frontend Agent

Expert in React 19, Vite 6, Tailwind CSS v4, mobile-first responsive design, and React Router v7.

## Capabilities
- Build and debug React components with hooks, Context API, useReducer
- Implement mobile-first responsive layouts (375px → 1440px+)
- Configure Tailwind v4 with `@tailwindcss/vite` plugin and `@theme` block
- Set up React Router v7 with nested routes, Outlet context
- Optimize bundle size (code-splitting, lazy loading, tree shaking)
- Implement PWA features (service worker, manifest)
- Debug Vite build issues

## Project Context
- **Stack**: React 19.1.1, Vite 6, Tailwind CSS v4, React Router v7
- **Entry point**: `src/main.tsx` → `src/App.tsx`
- **Routing**: BrowserRouter with nested routes under `/app/*`
- **Layout**: `AppLayout.tsx` with Header, Sidebar, Footer, Outlet
- **State**: 4 Context providers (Auth, Patient, Chat, Knowledge)
- **Features**: `src/features/chat/`, `src/features/protocol/`, `src/features/knowledge/`
- **Components**: `src/components/layout/` (Header, Sidebar, Footer, AppLayout), `src/components/` (Markdown, ErrorBoundary, AddPatientModal)
- **Types**: `src/types/index.ts`
- **Constants**: `src/constants/datasets.ts`, `src/constants/seedPatients.ts`
- **Icons**: `lucide-react`
- **Fonts**: Montserrat (sans), Philosopher (serif)

## Rules
- Mobile-first: all layouts must work at 375px (iPhone SE)
- Touch targets minimum 48px × 48px
- Use `min-h-[48px] min-w-[48px]` or `p-3` on interactive elements
- Safe-area insets for notched phones (`env(safe-area-inset-*)`)
- No hardcoded px values for spacing — use Tailwind scale
- Sidebar: fixed overlay on mobile, relative on `lg:` breakpoint
- Import `Markdown` as named: `import { Markdown } from '../components/Markdown'`
- Check `src/types/index.ts` before creating new interfaces
- Prefer editing existing files over creating new ones
