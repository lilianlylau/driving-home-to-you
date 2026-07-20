# Engineering guide

This file applies to the entire repository. Use it when planning or implementing work
for Driving Home to You.

## Product source of truth

Read `README.md` before making changes. It defines the product behavior, routes, copy,
validation, persistence contract, privacy requirements, and acceptance rules.

Use sources in this order when they appear to conflict:

1. Explicit requirements and acceptance rules in `README.md`.
2. Approved screenshots in `design/screenshots/` for visual intent.
3. Production assets in `public/assets/` for dimensions and composition.
4. Existing application behavior and tests, once they exist.

Do not silently resolve a material product conflict. Document it and choose the safest
reversible interpretation until a product decision is available.

## Implementation principles

- Build with React, TypeScript, and Vite. Use React Router for routes, Zustand for the
  creator draft/player state, Supabase for Postgres and private voice storage, and
  Vercel for hosting and server-side endpoints.
- Keep privileged Supabase access server-side. Never ship the service-role key, deletion
  token hashes, or private storage paths to the browser.
- Render all user and music metadata as plain text. Never use `dangerouslySetInnerHTML`
  for letters, titles, artists, or API error messages.
- Keep dynamic text and controls in HTML rather than baking them into image assets.
- Prefer small components with explicit typed boundaries over page-sized components.
- Keep server validation authoritative and mirror it in the UI for immediate feedback.
- Preserve creator work through navigation, refreshes, and recoverable failures.
- Treat accessibility, mobile behavior, error states, and reduced motion as acceptance
  requirements, not follow-up polish.
- Do not add authentication, editing of published drives, social features, analytics, or
  permanent storage without a product decision. Published drives are immutable in the
  MVP and expire after 90 days.

## Suggested structure

Adapt this only when the chosen framework integration requires it:

```text
api/                         # Vercel server functions
  drives/
  songs/
src/
  app/                       # router and app providers
  components/                # reusable visual and accessible controls
  features/
    creator/                 # draft steps and validation
    drive/                   # shared recipient experience
    player/                  # song and voice playback
  lib/                       # API client, validation, browser/media helpers
  stores/                    # Zustand stores and persistence adapters
  styles/                    # tokens, font declarations, global styles
  types/                     # shared client/domain types
supabase/
  migrations/                # schema, constraints, indexes, and RLS
  functions/                 # only if Edge Functions replace Vercel functions
tests/
  e2e/                       # critical creator and recipient journeys
```

Do not implement the same endpoint in both Vercel and Supabase functions. Select one
server runtime during foundation work and record the decision in the README.

## Implementation sequence

Each phase should leave the repository runnable and should include the tests appropriate
to the behavior introduced.

### 1. Establish the foundation

- Scaffold Vite with strict TypeScript and React.
- Add React Router, Zustand, the Supabase client, and a schema validator such as Zod.
- Add formatting, linting, type-checking, unit-test, and browser-test commands.
- Add `.gitignore`, `.env.example`, supported Node/package-manager versions, and CI.
- Define design tokens and load the bundled VT323 font.
- Create route shells for every route listed in `README.md`, including a not-found path.

Gate: a clean install can run, build, type-check, lint, and test in CI without secrets.

### 2. Build the static visual system

- Implement the shared page frame, logo/header, creator progress header, buttons, form
  controls, cassette, letter, voice recorder, and receiver dashboard composition.
- Match the supplied mobile and desktop screenshots with responsive CSS.
- Center-crop only the receiver video/dashboard media on narrow screens as specified.
- Add semantic structure, keyboard focus, useful alt text, and reduced-motion behavior.

Gate: all routes render against fixtures at 402 px and 1440 px without overflow, and
the pages remain usable with a keyboard and at 200% zoom.

### 3. Implement draft state and creator navigation

- Model one to three unique songs, required trimmed letter text of at most 500 characters,
  optional voice data, current step, and player state.
- Persist serializable draft data in local storage. Store recording blobs in IndexedDB;
  local storage is not suitable for binary audio.
- Restore navigation state after refresh and restore media paused when autoplay is not
  allowed. Clear the draft only after successful publication.
- Guard later creator routes when earlier required steps are incomplete.

Gate: unit tests cover validation, duplicate rejection, rehydration, route guards, and
draft clearing. A browser test covers forward, backward, and refresh recovery.

### 4. Add song search and preview playback

- Implement a bounded, debounced search through the server-side iTunes proxy.
- Normalize external results into the `Song` type; do not leak the upstream response
  shape throughout the UI.
- Add selection, removal, previous/play/next controls, elapsed time, and active-track
  handling. Stop or reset safely when the active song is removed.
- Display the specified inline unavailable-preview error without breaking other content.

Gate: tests cover stale searches, empty results, upstream failure, duplicate tracks,
three-track limits, removal, track transitions, and audio errors.

### 5. Implement letter and voice recording

- Add trimmed-required validation, an accessible character counter, and the 500-character
  limit to the letter step.
- Implement recorder states with `MediaRecorder`, MIME-type negotiation, microphone
  denial/unsupported-browser handling, a two-minute automatic stop, playback, replacement,
  and the optional skip path.
- Enforce the 5 MB client limit before upload while retaining server-side enforcement.

Gate: tests cover permission denial, unsupported recording, auto-stop, replacement,
refresh persistence, playback failure, and skip behavior.

### 6. Build persistence and server APIs

- Add migrations for `drives` and `drive_songs`, all README constraints and indexes, RLS
  that denies anonymous direct access, and the private voice bucket.
- Implement normalized JSON errors, short-ID generation, deletion-token hashing, signed
  voice URLs, and transactional drive/song creation with upload compensation.
- Validate every payload server-side. Bound query lengths, strings, request bodies, MIME
  types, audio duration, and file size.
- Add rate limiting and adaptive bot protection to creation.

Gate: integration tests prove that anonymous clients cannot list or mutate Supabase data,
duplicates and invalid payloads fail, collisions retry, partial uploads are cleaned up,
and private voice objects cannot be fetched without a valid signed URL.

### 7. Connect publishing and recipient flows

- Publish the optional recording and drive, retain the draft through failures, then show
  and copy the canonical share URL.
- Store the returned deletion token locally and provide a clear delete action.
- Render `/drive/:shortId` from server data, including ordered songs, letter, and optional
  signed voice playback.
- Render the landing page plus the exact not-found copy for malformed, missing, expired,
  or deleted IDs. Do not reveal which condition occurred.
- Ensure embedded previews use their alternate call-to-action copy.

Gate: end-to-end tests cover a drive with and without voice, retry after failed creation,
copying a share URL, deletion, expiry/not-found behavior, and stale song previews.

### 8. Add lifecycle, privacy, and operations

- Schedule cleanup of expired/deleted records and storage objects within seven days.
- Add the pre-publish privacy notice, 90-day expiry notice, abuse contact, and documented
  takedown procedure.
- Configure HTTPS redirects, CORS, CSP, security headers, safe structured logging, and
  secret management. Never log private content or tokens.
- Add error monitoring without letter text, song payloads, recording data, private URLs,
  raw IPs, or persistent analytics identifiers.

Gate: exercise cleanup in a non-production environment, verify security headers and
rate limits, and complete a manual privacy/log review.

### 9. Optimize and release

- Measure the supplied large video on a throttled mobile connection. Add an optimized
  delivery variant and poster/fallback if needed without replacing the approved source.
- Test supported browsers, especially recording MIME negotiation and mobile playback.
- Run accessibility, responsive, performance, and end-to-end checks against production
  configuration.
- Update `README.md` with the actual repository structure, setup, environment variables,
  migrations, testing, deployment, cleanup, and rollback instructions.

Gate: the full CI suite passes, a production-like smoke test can create/read/delete a
drive, and no launch-blocking accessibility, privacy, or security issues remain.

## Testing expectations

- Co-locate focused unit/component tests with implementation or use one consistent test
  tree; do not mix conventions arbitrarily.
- Mock the iTunes service at the network boundary. Tests must not depend on live previews.
- Use an isolated Supabase project or local Supabase for integration tests. Never point
  automated tests at production.
- Prefer user-observable assertions over component internals.
- Every bug fix should include a regression test when the behavior is deterministic.
- Before handing off a change, run the repository's format check, lint, type-check, unit
  tests, relevant integration/browser tests, and production build.

## Change discipline

- Keep migrations forward-only and review destructive schema changes explicitly.
- Update `.env.example` and README documentation whenever configuration changes, without
  committing real secrets.
- Preserve approved source assets. Derived optimized assets must have distinct names and
  documented generation settings.
- Remove operating-system metadata such as `Zone.Identifier` files rather than adding
  code that depends on them.
- Do not claim a phase or task is complete until its gate passes or the remaining gap is
  clearly reported.
