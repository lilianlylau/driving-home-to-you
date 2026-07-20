# Driving Home to You

Driving Home to You is a lo-fi web experience for sending something personal to someone far away. A creator builds a digital passenger-seat package with up to three songs, a letter, and an optional voice memo, then shares a unique link. The recipient opens that link to enjoy the package against a sunny, retro road-trip backdrop.

The repository contains the React/Vite application, Vercel server APIs, Supabase persistence
schema, approved visual references, and production assets.

## Experience overview

### Creator flow

1. **Landing page** — Introduces the experience, links to the creator flow, and previews a completed passenger seat.
2. **Mixtape** — Lets the creator search for and select up to three songs, preview them, move between tracks, and remove selections.
3. **Letter** — Provides a paper-textured writing area for a personal message.
4. **Voice memo** — Lets the creator record an optional message, stop recording, play it back, or record it again.
5. **Share and preview** — Generates a shareable URL and displays the completed recipient experience as a preview.

### Recipient flow

The shared page presents:

- a looping sunny-drive scene above a dashboard and tape recorder;
- a three-track cassette and player;
- a letter on the passenger seat;
- a playable voice memo; and
- a closing call to action to create a new package.

The intended routes are:

| Route             | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `/`               | Landing page and example recipient preview   |
| `/create/mixtape` | Step one: choose up to three songs           |
| `/create/letter`  | Step two: write a letter                     |
| `/create/memo`    | Step three: record or skip a voice memo      |
| `/create/share`   | Generated link and completed-package preview |
| `/drive/:shortId` | Recipient's shared passenger-seat experience |

## Design references

The screenshots are implementation references for layout, spacing, typography, copy, component states, and responsive behavior.

| File                                                    |    Viewport | Reference                                   |
| ------------------------------------------------------- | ----------: | ------------------------------------------- |
| `design/screenshots/desktop-00-landing-page.png`        | 1440 × 2118 | Desktop landing page and example experience |
| `design/screenshots/desktop-04-share-url.png`           | 1440 × 2118 | Desktop share page and creator preview      |
| `design/screenshots/desktop-shared-url.png`             | 1440 × 1921 | Desktop recipient page                      |
| `design/screenshots/mobile-00-landing-page.png`         |  402 × 2118 | Mobile landing page and example experience  |
| `design/screenshots/mobile-01-music.png`                |   402 × 874 | Mobile mixtape step                         |
| `design/screenshots/mobile-02-letter.png`               |   402 × 874 | Mobile letter step                          |
| `design/screenshots/mobile-03a-no-recording-state.png`  |   402 × 874 | Voice memo: empty state                     |
| `design/screenshots/mobile-03b-recording-state.png`     |   402 × 874 | Voice memo: recording state                 |
| `design/screenshots/mobile-03c-has-recording-state.png` |   402 × 874 | Voice memo: recorded state                  |
| `design/screenshots/mobile-04-share-url.png`            |  402 × 2098 | Mobile share page and creator preview       |
| `design/screenshots/mobile-shared-url.png`              |  402 × 1921 | Mobile recipient page                       |

Desktop and mobile use the same screen layout. On mobile, only the receiver-header media is cropped: show the center of `sunny-drive-loop.mp4` and `tape-recorder-on-dashboard.png` rather than shrinking either asset to fit the viewport.

## Asset catalog

All runtime assets live under `public/assets` and can be referenced from the app with root-relative URLs such as `/assets/logo/logo.png`.

```text
public/assets/
├── creator-header/
│   ├── fuel-gauge-step-1.png
│   ├── fuel-gauge-step-2.png
│   └── fuel-gauge-step-3.png
├── fonts/VT323/
│   ├── OFL.txt
│   └── VT323-Regular.ttf
├── letter/
│   ├── note-empty.png
│   └── note-example.png
├── logo/
│   └── logo.png
├── mixtape/
│   ├── cassette-empty.png
│   ├── cassette-example.png
│   ├── mixtape-empty.png
│   ├── mixtape-song-example.png
│   └── mixtape-song-with-remove-example.png
├── receiver-header/
│   ├── sunny-drive-loop.mp4
│   └── tape-recorder-on-dashboard.png
└── voice-memo/
    ├── tape-recorded.png
    ├── tape-recorder-off.png
    ├── tape-recorder-on.png
    └── tape-recording.png
```

Files ending in `-empty` are clean composition surfaces for dynamic content. Files ending in `-example`, plus the recording-strip assets, show the intended overlays and states and should be used as visual references where content needs to remain dynamic.

The included VT323 font is licensed under the SIL Open Font License; see `public/assets/fonts/VT323/OFL.txt`.

## UI behavior and copy

### Landing page

- Headline: “drive home to someone you miss”
- Supporting copy: “pack a mixtape, a letter, and a voice note. start your drive home to someone far away.”
- Primary action: “start here”
- Preview heading: “preview the passenger seat”
- Preview copy: “leave this screen open, turn up the volume, and enjoy the drive together.”

### Step one: mixtape

- Heading: “step one. queue up the mixtape”
- Supporting copy: “pick up to three songs that reminds you of them”
- Search placeholder: “search song or artist”
- The selected songs are written onto the cassette label.
- The player shows the active title and artist, elapsed time, and previous/play/next controls.
- Each selected track has a “remove” action; continue with “next.”
- At least one song is required and no more than three may be selected.
- The same iTunes track ID cannot be selected more than once. Disable or replace the
  add action for tracks that are already on the mixtape.

Song search is intended to use the [iTunes Search API](https://itunes.apple.com/search). Store enough metadata to render and play each selection: an ID, title, artist, preview audio URL, and optional artwork URL.

If a preview URL is missing or no longer plays, keep the song in the mixtape and show
an inline error: “this song preview is no longer available.” The rest of the recipient
experience must remain usable.

### Step two: letter

- Heading: “step two. write them a letter”
- Supporting copy: “leave a note for the dashboard. it can be long, short, or just a quick hello.”
- Placeholder: “start writing...”
- Actions: “back” and “next”
- A letter is required, must contain non-whitespace text, and is limited to 500
  characters. Show the current character count and prevent advancing when invalid.

Render editable text over `note-empty.png`; `note-example.png` demonstrates the expected result.

### Step three: voice memo

- Heading: “step three. record a voice memo”
- Supporting copy: “sometimes messages are better aloud. optional.”
- Empty state: `tape-recorder-off.png`; actions are “record audio” and “skip.”
- Recording state: `tape-recording.png` above `tape-recorder-on.png`; show elapsed time and “stop recording.”
- Recorded state: `tape-recorded.png` above `tape-recorder-off.png`; show duration and the actions “play back,” “record again,” and “done.”

Recording requires microphone permission. The intended maximum duration is two minutes, with a browser-supported compressed format such as WebM uploaded to storage.

### Share page

- Heading: “share this link to invite them into your passenger seat.”
- Display the generated URL prominently in a copyable field.
- Render the completed recipient page below the link so the creator can review the result.

### Recipient page

- Heading: “someone wishes they were driving home to you.”
- Supporting copy: “pull up a seat. they left a few things on the dashboard for you.”
- Place `sunny-drive-loop.mp4` directly above `tape-recorder-on-dashboard.png` so they read as one continuous windshield/dashboard scene.
- Play `sunny-drive-loop.mp4` as an endless loop.
- Mixtape heading: “pop the mixtape in.” / “songs they picked for the road.”
- Letter heading: “a letter left on the passenger seat.” / “from them, to you.”
- Voice heading: “a voice note from the drive.” / “press the tape recorder to hear their voice.”
- Clicking the tape recorder toggles voice-memo playback.
- Closing copy: “leave this screen open, turn up the volume, and enjoy the drive together.”
- The standalone shared page ends with “start your drive home”; embedded landing/share previews use “send a message back.”

If the short ID is unknown, malformed, expired, or belongs to a deleted drive, render
the landing page with the message: “sorry we couldn't find your mixtape and letter”.
Return an HTTP 404 where the hosting platform supports route-level status codes.

### Creator draft behavior

- Persist the selected songs, letter, current step, and completed voice recording when
  moving backward or forward and across a page refresh in the same browser.
- Preserve playback position and the active track when moving between creator steps
  during the same browser session. It is acceptable to restore a paused player after a
  full refresh because browsers commonly block automatic audio playback.
- Replacing a voice recording removes the previous local recording. Clear the complete
  draft only after the drive record and any voice upload have both succeeded.

## Visual direction

- Preserve the sparse white canvas, centered composition, lowercase copy, and restrained charcoal and dark-red controls.
- Use VT323 for the pixel/monospace interface text. The script lettering in the logo is already baked into `logo.png`.
- Keep all text, form controls, and playback controls accessible and functional rather than baking dynamic content into imagery.
- Maintain the native aspect ratios of the supplied images and video.
- Keep the same centered layout on desktop and mobile; center-crop the two receiver-header assets on narrow viewports.
- Provide visible focus styles, keyboard-operable controls, useful alternative text, and reduced-motion handling for the looping video.

## Proposed implementation contract

The app uses React, TypeScript, and Vite, with React Router, Zustand, Supabase, and deployment to Vercel.

Expected data shape:

```ts
interface Song {
  id: string
  title: string
  artist: string
  audioUrl: string
  albumArtUrl?: string
}

interface DriveData {
  id?: string
  shortId?: string
  songs: Song[] // maximum 3
  noteText: string
  voiceMemoUrl?: string
  createdAt?: string
}
```

Persist an in-progress creator draft across refreshes, upload the optional audio blob before creating the share record, generate a short ID for `/drive/:shortId`, and clear the local draft only after successful creation.

### Backend and persistence

Use Supabase Postgres and a private Supabase Storage bucket. The frontend must access
drive records through server-side endpoints or functions; do not expose the Supabase
service-role key or allow anonymous clients to list database rows or storage objects.

Use the following logical schema (exact SQL types and migration syntax may follow the
installed Supabase version):

```text
drives
  id                 uuid primary key
  short_id           text unique, indexed, not null
  note_text          text not null, length 1..500 after trimming
  voice_object_path  text null
  voice_duration_ms  integer null, 1..120000 when present
  created_at         timestamptz not null
  expires_at         timestamptz not null
  deleted_at         timestamptz null
  delete_token_hash  text not null

drive_songs
  drive_id           uuid references drives(id) on delete cascade
  position           smallint, 0..2
  source             text, fixed to "itunes" for the MVP
  source_track_id    text not null
  title              text not null
  artist             text not null
  preview_url        text not null
  artwork_url        text null
  primary key (drive_id, position)
  unique (drive_id, source, source_track_id)
```

Creation is an atomic operation from the caller's perspective:

1. Validate and normalize all input server-side. Require one to three unique songs and
   a non-empty letter of at most 500 characters.
2. Generate a cryptographically random, URL-safe short ID with at least 72 bits of
   entropy. Retry on a unique-constraint collision.
3. If present, validate and upload the voice memo under a server-generated object path.
4. Insert the drive and ordered songs in a transaction. If the database write fails,
   remove the newly uploaded object.
5. Return the share URL and a one-time deletion token. Store only a keyed hash of that
   token in the database and retain the token in the creator's local draft/settings.

Shared drives are immutable in the MVP. A creator may delete a drive using its deletion
token, but losing the token means it cannot be recovered. Reads return only non-deleted,
non-expired drives. Generate a short-lived signed URL for a private voice object as part
of a successful read response; never expose its storage path as a public asset URL.

Expire drives 90 days after creation. A scheduled cleanup job must permanently remove
expired/deleted database records and voice objects within seven days. Tell creators on
the share screen that links last 90 days. Do not collect names, email addresses, IP
addresses, or analytics identifiers as application data unless the privacy notice is
updated first. Infrastructure security logs may follow the hosting provider's standard
short-term retention.

### API behavior

The deployed implementation should expose equivalent operations, regardless of whether
they are implemented as Vercel functions or Supabase Edge Functions:

| Operation    | Behavior                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Search songs | Server-side proxy to iTunes; accept a bounded query and return normalized results only                                 |
| Create drive | Validate content, optionally upload audio, create the record, and return `shortId`, share URL, and deletion token      |
| Read drive   | Return the public drive payload and a short-lived signed voice URL; return 404 for missing, expired, or deleted drives |
| Delete drive | Require the deletion token, mark the drive deleted, and queue its audio for cleanup                                    |

Use consistent JSON error bodies with a stable machine-readable code and safe user
message. The UI must provide retry actions for search, creation, upload, and playback
failures and must not discard the creator draft after a failed request.

### Privacy, security, and abuse controls

- Apply row-level security that denies direct anonymous reads, writes, updates, deletes,
  and listing. Only the server-side implementation may use privileged database access.
- Rate-limit song search, drive creation, drive reads, and deletion by a privacy-conscious
  combination of IP-derived rate-limit key and short time window. Do not store raw IPs in
  application tables.
- Add a bot challenge to drive creation after suspicious volume, and enforce both a
  global creation limit and per-client limits. Return `429` with a retry delay when hit.
- Accept voice data only from the recording flow, with an allowlist of MIME types. Check
  the actual uploaded content, maximum two-minute duration, and a 5 MB size limit on the
  server. Use a server-generated filename and never render user-provided content as HTML.
- Normalize text, reject control characters, and render letters, titles, and artist names
  as plain text to prevent script injection. Bound every string and request body.
- Use HTTPS, restrictive CORS, standard security headers, and a Content Security Policy
  limited to the app, Supabase endpoints, required media hosts, and the iTunes service.
- Show a concise notice before creation explaining that anyone with the link can view the
  letter and listen to the recording, that the link expires after 90 days, and that the
  creator should not include sensitive information.
- Provide a report-abuse contact on shared and not-found pages. Operational staff may
  remove reported content by drive ID; document that process before launch.
- Do not log letter text, song payloads, voice URLs, deletion tokens, or recording data.

### Acceptance rules

- Supported creator navigation never loses valid songs, letter text, a completed voice
  recording, the active track, or playback position.
- Duplicate songs are rejected in both the interface and backend.
- A drive cannot be created without one to three playable song selections and a valid
  letter. The voice memo remains optional.
- A failed or stale song preview shows the specified inline error without breaking other
  tracks or content.
- Invalid, missing, expired, and deleted short IDs all show the specified landing-page
  message without revealing which condition occurred.

## Repository structure

```text
.
├── .github/workflows/ci.yml
├── src/                   # React routes, components, stores, styles, and types
├── tests/e2e/             # Responsive route smoke tests
├── README.md
├── design/
│   └── screenshots/    # Approved desktop and mobile page references
└── public/
    └── assets/         # Runtime font, image, and video assets
```

## Local development

Use Node 22 and npm 10 (see `.nvmrc` and `package.json`).

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env.local` when connecting a Supabase project. Apply migrations
from `supabase/migrations/` to an isolated local or development project first.
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are optional browser-safe values. The
server APIs require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, a random secret of at
least 32 characters in `API_HASH_SECRET`, and the canonical `PUBLIC_APP_URL`.
`TURNSTILE_SECRET_KEY` is required once adaptive creation challenges are reached. Never
place the service-role key or hash secret in a `VITE_` variable.

Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, and `npm run build` before handing off a change.

## Runtime and deployment decision

Vercel server functions under `api/` are the selected runtime for song search and drive
APIs. Supabase Edge Functions do not duplicate these endpoints. The existing iTunes proxy
remains the song-search implementation and returns only the normalized `Song` shape.

`POST /api/drives` accepts JSON for drives without a recording. For a recording it accepts
`multipart/form-data` with a JSON `payload` field and a binary `voice` field. `GET
/api/drives/:shortId` returns active public drive data with a five-minute signed voice URL;
`DELETE /api/drives/:shortId` accepts `{ "deletionToken": "..." }`. All errors use
`{ "code": "stable_code", "message": "safe message" }`.

The migration creates an atomic `create_drive_with_songs` database function, private
`voice-memos` storage, and shared rate-limit counters. RLS is enabled with no anonymous or
authenticated policies; only server-side service-role calls can access private records.
Recordings are limited to 5 MB and two minutes, and their container signature and duration
are inspected server-side. Rate-limit rows contain keyed client hashes, never raw IPs.
