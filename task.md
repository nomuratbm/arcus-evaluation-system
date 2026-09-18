# Cognito Auth Implementation Tasks

- [x] **1. Install dependencies**
  - [x] Add `aws-jwt-verify`

- [x] **2. Role simplification**
  - [x] Update `types.ts` — `AppRole` → `"admin"`, extend `AppSession`
  - [x] Update `session.ts` — add `requireAdmin()`, env-switch for adapter
  - [x] Update `stub.ts` — return `role: "admin"`

- [x] **3. Cognito adapter + JWT**
  - [x] Create `src/lib/auth/jwt.ts`
  - [x] Create `src/lib/auth/adapters/cognito.ts`

- [x] **4. Landing page → forms**
  - [x] Move evaluation form to `/app/page.tsx`
  - [x] Redirect `/forms` → `/`
  - [x] Update `/forms/submitted` links

- [x] **5. Public header with Login button**
  - [x] Create `src/components/ui/public-header.tsx`
  - [x] Add to root layout

- [x] **6. Login / Logout flow**
  - [x] Create `/api/auth/login/route.ts`
  - [x] Create `/api/auth/callback/route.ts`
  - [x] Create `/api/auth/logout/route.ts`

- [x] **7. Next.js middleware**
  - [x] Create `src/proxy.ts`

- [x] **8. Update existing callers**
  - [x] `/officer/layout.tsx` → `requireAdmin()`
  - [x] `/officer/page.tsx` → `requireAdmin()`
  - [x] `/export/layout.tsx` → `requireAdmin()`
  - [x] `/api/export/evaluations/route.ts` → `requireAdmin()`
  - [x] `/api/export/evaluations/[evaluationId]/pdf/route.ts` → `requireAdmin()`

- [x] **9. Environment config**
  - [x] Update `.env.example`

- [ ] **10. Verify**
  - [ ] `npm run build` succeeds
  - [ ] `npm test` passes
