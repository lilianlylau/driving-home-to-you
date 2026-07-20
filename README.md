# Driving Home to You

Driving Home to You is a lo-fi web experience for sending something personal to someone far away. A creator builds a digital passenger-seat package with up to three songs, a letter, and an optional voice memo, then shares a unique link. The recipient opens that link to enjoy the package against a sunny, retro road-trip backdrop.

This repository currently contains the approved visual references and production assets for the project. There is no application source or project configuration yet. Treat `design/screenshots` and `public/assets` as the source of truth when implementing the app; the details below document those files rather than an existing implementation.

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

| Route | Purpose |
| --- | --- |
| `/` | Landing page and example recipient preview |
| `/create/mixtape` | Step one: choose up to three songs |
| `/create/letter` | Step two: write a letter |
| `/create/memo` | Step three: record or skip a voice memo |
| `/create/share` | Generated link and completed-package preview |
| `/drive/:shortId` | Recipient's shared passenger-seat experience |

## Design references

The screenshots are implementation references for layout, spacing, typography, copy, component states, and responsive behavior.

| File | Viewport | Reference |
| --- | ---: | --- |
| `design/screenshots/desktop-00-landing-page.png` | 1440 × 2118 | Desktop landing page and example experience |
| `design/screenshots/desktop-04-share-url.png` | 1440 × 2118 | Desktop share page and creator preview |
| `design/screenshots/desktop-shared-url.png` | 1440 × 1921 | Desktop recipient page |
| `design/screenshots/mobile-00-landing-page.png` | 402 × 2118 | Mobile landing page and example experience |
| `design/screenshots/mobile-01-music.png` | 402 × 874 | Mobile mixtape step |
| `design/screenshots/mobile-02-letter.png` | 402 × 874 | Mobile letter step |
| `design/screenshots/mobile-03a-no-recording-state.png` | 402 × 874 | Voice memo: empty state |
| `design/screenshots/mobile-03b-recording-state.png` | 402 × 874 | Voice memo: recording state |
| `design/screenshots/mobile-03c-has-recording-state.png` | 402 × 874 | Voice memo: recorded state |
| `design/screenshots/mobile-04-share-url.png` | 402 × 2098 | Mobile share page and creator preview |
| `design/screenshots/mobile-shared-url.png` | 402 × 1921 | Mobile recipient page |

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

Song search is intended to use the [iTunes Search API](https://itunes.apple.com/search). Store enough metadata to render and play each selection: an ID, title, artist, preview audio URL, and optional artwork URL.

### Step two: letter

- Heading: “step two. write them a letter”
- Supporting copy: “leave a note for the dashboard. it can be long, short, or just a quick hello.”
- Placeholder: “start writing...”
- Actions: “back” and “next”

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

## Visual direction

- Preserve the sparse white canvas, centered composition, lowercase copy, and restrained charcoal and dark-red controls.
- Use VT323 for the pixel/monospace interface text. The script lettering in the logo is already baked into `logo.png`.
- Keep all text, form controls, and playback controls accessible and functional rather than baking dynamic content into imagery.
- Maintain the native aspect ratios of the supplied images and video.
- Keep the same centered layout on desktop and mobile; center-crop the two receiver-header assets on narrow viewports.
- Provide visible focus styles, keyboard-operable controls, useful alternative text, and reduced-motion handling for the looping video.

## Proposed implementation contract

The original project direction calls for React, TypeScript, and Vite, with React Router, Zustand, Supabase, and deployment to Vercel. These dependencies have not yet been installed in this repository.

Expected data shape:

```ts
interface Song {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  albumArtUrl?: string;
}

interface DriveData {
  id?: string;
  shortId?: string;
  songs: Song[]; // maximum 3
  noteText: string;
  voiceMemoUrl?: string;
  createdAt?: string;
}
```

Persist an in-progress creator draft across refreshes, upload the optional audio blob before creating the share record, generate a short ID for `/drive/:shortId`, and clear the local draft only after successful creation.

## Repository structure

```text
.
├── README.md
├── design/
│   └── screenshots/    # Approved desktop and mobile page references
└── public/
    └── assets/         # Runtime font, image, and video assets
```

When application code is added, update this section and add concrete setup, environment-variable, development, test, and deployment instructions based on the implementation that actually exists.
