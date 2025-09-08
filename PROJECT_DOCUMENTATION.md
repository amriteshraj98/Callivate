## Callivate – Project Documentation

This document explains the architecture, data model, APIs, routes, auth/integrations, and major flows of the Callivate project. It’s meant to be the one place where you can understand how everything connects and how to extend or maintain the system.

### High-level Overview
- **Framework**: Next.js App Router (TypeScript, React server/client components)
- **Backend**: Convex (database + serverless functions for queries/mutations + HTTP router)
- **Auth**: Clerk (middleware-protected app, user sync via webhook to Convex)
- **Video/Meetings**: Stream Video SDK (token generated via server action, client set up via provider)
- **Styling/UI**: Shadcn UI components, Tailwind CSS
- **State/Providers**: Convex + Clerk provider, Stream Video provider, Theme provider

### Directory Map (key folders)
- `src/app` – App Router pages/layouts
  - `(root)` area: `questions`, `interviews`, `recordings`, `schedule`, `meeting/[id]`, shared `layout.tsx`
  - `(admin)` area: `dashboard/page.tsx`
- `convex` – Convex schema and server functions
- `src/components` – UI components and providers
- `src/actions` – Server actions (e.g., token generation for Stream)
- `src/hooks` – Client hooks to fetch/use Convex data and app logic
- `public` – Static assets

---

## Data Model (Convex Schema)
Defined in `convex/schema.ts`.

- `users`
  - `name: string`
  - `email: string`
  - `image?: string`
  - `role: "candidate" | "interviewer"`
  - `clerkId: string`
  - Indexes: `by_clerk_id (clerkId)`

- `interviews`
  - `title: string`
  - `description?: string`
  - `startTime: number`
  - `endTime?: number`
  - `status: string` (e.g., scheduled | in-progress | completed)
  - `streamCallId: string`
  - `candidateId: string` (Clerk user id)
  - `interviewerIds: string[]` (array of Clerk user ids)
  - `result?: "pass" | "fail"`
  - `review?: { rating: number; feedback: string; strengths?: string[]; areasForImprovement?: string[]; overallAssessment: string; recommendedForNextRound?: boolean }`
  - `reviewedBy?: string` (Clerk id)
  - `reviewedAt?: number`
  - Indexes: `by_candidate_id (candidateId)`, `by_stream_call_id (streamCallId)`, `by_status (status)`, `by_result (result)`

- `comments`
  - `content: string`
  - `rating: number`
  - `interviewerId: string` (Clerk id)
  - `interviewId: Id<"interviews">`
  - Indexes: `by_interview_id (interviewId)`

- `questions`
  - `title: string`
  - `description: string`
  - `examples: { input: string; output: string; explanation?: string }[]`
  - `starterCode: { javascript: string; python: string; java: string; cpp: string }`
  - `constraints?: string[]`
  - `createdBy: string` (Clerk id)
  - `isDefault?: boolean`
  - Indexes: `by_created_by (createdBy)`, `by_default (isDefault)`

---

## Backend APIs (Convex Functions)

All functions live under `convex/*.ts` and are exposed via the generated API client `convex/_generated/api` for `useQuery`/`useMutation`.

### Users (`convex/users.ts`)
- `syncUser` (mutation)
  - Args: `{ name, email, clerkId, image? }`
  - Behavior: Idempotently inserts user with default `role: "candidate"` if not existing by `clerkId`. Triggered by Clerk webhook on `user.created`.
- `getUsers` (query)
  - Auth required. Returns all users.
- `getUserByClerkId` (query)
  - Args: `{ clerkId }`. Returns the user document if found.
- `updateUserRole` (mutation)
  - Args: `{ clerkId, role: "candidate" | "interviewer" }`
  - Auth required. Updates a user’s role.

### Interviews (`convex/interviews.ts`)
- `getAllInterviews` (query)
  - Auth required. Returns all interviews.
- `getMyInterviews` (query)
  - Auth optional; returns `[]` if not signed in. Returns interviews where `candidateId` equals current user id.
- `getInterviewsByStatus` (query)
  - Args: `{ status }`. Auth optional; returns `[]` if not signed in. Returns interviews with matching status.
- `getCompletedInterviews` (query)
  - Auth optional; returns `[]` if not signed in. Returns `status === "completed"`.
- `getInterviewsByInterviewer` (query)
  - Auth optional; returns `[]` if not signed in. Returns interviews where current user id is in `interviewerIds`.
- `getInterviewByStreamCallId` (query)
  - Args: `{ streamCallId }`. Returns first match by index.
- `createInterview` (mutation)
  - Args: `{ title, description?, startTime, endTime?, status, streamCallId, candidateId, interviewerIds }`
  - Auth required. Inserts a new interview.
- `updateInterviewStatus` (mutation)
  - Args: `{ id: Id<"interviews">, status }`
  - If status becomes `completed`, sets `endTime = Date.now()`.
- `submitInterviewReview` (mutation)
  - Args: `{ interviewId, result: "pass"|"fail", review: {...} }`
  - Auth required; only permitted if current user is in `interviewerIds`. Patches result, review, sets `status` to `completed`, and audit fields `reviewedBy`, `reviewedAt`.
- `updateInterviewResult` (mutation)
  - Args: `{ interviewId, result: "pass"|"fail" }`
  - Auth required; only if current user is an interviewer on that interview. Patches result and audit fields.

### Comments (`convex/comments.ts`)
- `addComment` (mutation)
  - Args: `{ interviewId, content, rating }`
  - Auth required. Inserts a comment tied to an interview, setting `interviewerId` to the current user.
- `getComments` (query)
  - Args: `{ interviewId }`. Returns comments for an interview by index.

### Questions (`convex/questions.ts`)
- `getQuestions` (query)
  - Auth required. Returns all questions created by the current user.
- `getQuestionById` (query)
  - Args: `{ questionId }`. Returns the question doc.
- `createQuestion` (mutation)
  - Args: question fields. Auth required. Inserts with `createdBy` and `isDefault = false`.
- `updateQuestion` (mutation)
  - Args: `{ questionId, ...fields }`. Auth required. Only owner can update.
- `deleteQuestion` (mutation)
  - Args: `{ questionId }`. Auth required. Only owner can delete.
- `clearAllQuestions` (mutation)
  - Auth required. Deletes all questions (utility/reset function).

### HTTP Routes (`convex/http.ts`)
- `POST /clerk-webhook`
  - Verifies Svix signature headers from Clerk.
  - On `user.created`, calls `users.syncUser` to mirror Clerk user into Convex.

---

## Auth and Integrations

### Clerk
- Middleware: `src/middleware.ts` uses `clerkMiddleware` to protect the app and API routes.
- Provider: `src/components/providers/ConvexClerkProvider.tsx` wraps the app with `ClerkProvider` and Convex client with Clerk auth.
- Webhook: `convex/http.ts` processes `user.created` to `syncUser` into Convex.

### Stream Video
- Server action: `src/actions/stream.actions.ts` defines `streamTokenProvider` which generates a user token with `@stream-io/node-sdk`.
- Client provider: `src/components/providers/StreamClientProvider.tsx` initializes `StreamVideoClient` and mounts `<StreamVideo>` with the server action token provider.
- Integration point: Meeting-related pages/components use Stream for video calls via `streamCallId` on interviews.

### Theming
- `src/components/providers/ThemeProvider.tsx` wraps `next-themes` provider.

---

## App Routes and Layouts

### Global Layout (`src/app/layout.tsx`)
- Wraps with `ConvexClerkProvider`, `ThemeProvider`, renders `Navbar`, `QuestionInitializer`, and `<Toaster />`.
- Uses Clerk’s `SignedIn`/`SignedOut` to gate the app; signed-out users are redirected to sign-in.

### (root) group
- `(home)/page.tsx` – Home dashboard/landing for signed-in users.
- `questions/page.tsx` – Question Management UI using Convex questions APIs.
- `interviews/page.tsx` – Lists interviews; shows actions based on role and status; integrates review UI.
- `recordings/page.tsx` – Recordings listing (Stream-based).
- `schedule/page.tsx` – Scheduling UI for interviews.
- `meeting/[id]/page.tsx` – Meeting room tied to `streamCallId`. Enables call controls, end-call, and review triggers.

### (admin) group
- `dashboard/page.tsx` – Admin view to manage interviews, statuses, and reviews across users.

Note: Files above are present in `src/app` structure; components/hook usage wires them to the APIs described.

---

## Core Components (selected)
- `Navbar` – top navigation; shows `Questions`, `Interviews`, Mode toggle, Dashboard button, and Clerk `UserButton`.
- `InterviewCard`, `MeetingCard` – represent interview/meeting items and actions.
- `InterviewReviewDialog`, `InterviewReviewDisplay` – submit/update and view interview reviews.
- `QuestionManager`, `CodeEditor` – CRUD and editing for questions and starter code.
- `MeetingRoom`, `MeetingSetup`, `EndCallButton` – Stream call experience.
- `providers/*` – Convex+Clerk, Stream Video, Theme providers.
- `ui/*` – shadcn primitives used across the app.

---

## Key Hooks (selected)
- `useGetCalls`, `useGetCallById` – fetch meeting/call info (Stream integration helpers).
- `useInitializeQuestions` – seeds or hydrates questions into state/UI.
- `useMeetingActions` – centralizes common call-related actions.
- `useUserRole` – get current user role from Convex.

---

## Request/Response and Data Flows

1) Sign in / User bootstrap
- Clerk middleware ensures user is authenticated to access app pages.
- On Clerk `user.created`, Clerk sends a webhook to Convex `/clerk-webhook`. Convex verifies via Svix and calls `users.syncUser` to mirror the user into Convex DB with default role `candidate`.

2) Stream Video token flow
- Client mounts `StreamClientProvider` → requests token via `streamTokenProvider` server action.
- Server action uses `StreamClient` with secret to generate token for the Clerk user id.
- Client uses this token in `StreamVideoClient` for calls.

3) Interview lifecycle
- Create: UI triggers `interviews.createInterview` with title, start/end times, candidate and interviewer IDs, and `streamCallId`.
- Update status: `interviews.updateInterviewStatus` transitions status and sets `endTime` when completed.
- Review: Interviewers assigned to the interview can call `interviews.submitInterviewReview` or `updateInterviewResult` to record pass/fail and feedback.

4) Comments
- Interviewers can add comments via `comments.addComment`; UI fetches with `comments.getComments`.

5) Questions
- Users manage their own questions via `questions.*` APIs. Questions are scoped by `createdBy` Clerk id.

---

## Environment Variables

Set these in your environment (e.g., `.env.local` for Next.js, Convex dashboard/secrets for Convex):

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Convex
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud

# Stream
NEXT_PUBLIC_STREAM_API_KEY=stream_public_key
STREAM_SECRET_KEY=stream_secret_key
```

Additionally, Convex’s `convex/auth.config.ts` lists the Clerk issuer information used by Convex auth.

---

## Setup and Running Locally

1) Install dependencies
```bash
npm install
```

2) Configure environment variables
- Create `.env.local` with Clerk and Stream keys shown above; add `NEXT_PUBLIC_CONVEX_URL`.
- Configure secrets for Convex (e.g., via Convex dashboard or env) so `convex/http.ts` can read `CLERK_WEBHOOK_SECRET`.

3) Start the dev server
```bash
npm run dev
```

4) Configure Clerk webhook to Convex
- Point a Clerk webhook to `POST https://<your-convex-deployment>.convex.cloud/clerk-webhook` with the `CLERK_WEBHOOK_SECRET` set identically in Convex.

---

## Security and Authorization
- Middleware blocks unauthenticated access to app and API routes.
- Convex functions typically gate with `ctx.auth.getUserIdentity()`.
- Interview review and result updates ensure the caller is an assigned interviewer.
- Questions CRUD enforces ownership by `createdBy`.

---

## Extensibility Pointers

### Add a new Convex API
1) Create function in `convex/<domain>.ts` with `query`/`mutation`.
2) Use `v` validators for args; check `ctx.auth.getUserIdentity()` as needed.
3) Access via generated API in React using `useQuery(api.<domain>.<fn>)` or `useMutation(api.<domain>.<fn>)`.

### Add a new page
1) Create a folder under `src/app/<route>/page.tsx`.
2) Use client/server components as appropriate; fetch data from Convex via hooks/components.
3) Gate access with Clerk `SignedIn/Out` if needed or rely on global layout.

### Add roles / permissions
1) Extend `users.role` enum in `schema.ts`.
2) Update UI gating and Convex mutations/queries to enforce new permissions.

---

## Inventory – APIs (Quick List)

- Users
  - mutations: `syncUser`, `updateUserRole`
  - queries: `getUsers`, `getUserByClerkId`
- Interviews
  - queries: `getAllInterviews`, `getMyInterviews`, `getInterviewsByStatus`, `getCompletedInterviews`, `getInterviewsByInterviewer`, `getInterviewByStreamCallId`
  - mutations: `createInterview`, `updateInterviewStatus`, `submitInterviewReview`, `updateInterviewResult`
- Comments
  - mutations: `addComment`
  - queries: `getComments`
- Questions
  - queries: `getQuestions`, `getQuestionById`
  - mutations: `createQuestion`, `updateQuestion`, `deleteQuestion`, `clearAllQuestions`
- HTTP (Convex)
  - `POST /clerk-webhook`

---

## Inventory – Routes (Quick List)

- `(root)`
  - `/` – Home
  - `/questions` – Question management
  - `/interviews` – Interviews list and actions
  - `/recordings` – Recordings list
  - `/schedule` – Interview scheduling
  - `/meeting/[id]` – Meeting room
- `(admin)`
  - `/dashboard` – Admin dashboard

---

## Notable UX Behaviors
- Signed-out users are redirected to sign-in.
- Navbar shows `Questions` and `Interviews` when signed in; also shows a Dashboard button, theme toggle, and user menu.
- Interview review dialogs enforce required fields and role-based access.
- Question management is scoped to the current user; default questions appear read-only.

---

## Troubleshooting
- 401/Unauthorized from Convex functions usually indicates missing Clerk session in the client or server.
- Stream token errors: ensure `STREAM_SECRET_KEY` is available to the server action and `NEXT_PUBLIC_STREAM_API_KEY` to the client.
- Clerk webhook errors at Convex: verify `CLERK_WEBHOOK_SECRET` and the Svix headers are forwarded from Clerk.

---

## References
- Next.js App Router
- Convex (functions, database, HTTP router)
- Clerk (Next.js middleware, webhooks)
- Stream Video React SDK and Node SDK

