# Driving Home to You

A lofi, web application for people missing someone far away. Creators craft a personalized experience by choosing up to 3 songs, writing a letter, and optionally recording a voice memo. Receivers open a unique share link to see a looping driving video on a retro dashboard UI with playable music, a handwritten note, and a voice memo player.

## Technical Stack
Framework & Build: React 18 + TypeScript + Vite 6

Routing: React Router v6

State Management: Zustand (with sessionStorage and IndexedDB persistence)

Styling: Tailwind CSS / CSS Modules

Backend / Persistence: Supabase (Database, Storage, Edge Functions)

Audio Recording: Web Audio API (MediaRecorder API)

Deployment: Vercel

## Application Routes

### Creator Flow

`/:` Landing Page

Hero Text: "drive home to someone you miss."
Subheader: "pack a mixtape, a letter, and a voice note. start your drive home to someone far away."
CTA: "start here"

Second Hero Text: "preview the passenger seat"
Second Subheader: "leave this screen open, turn up the volume, and enjoy the drive together."

`/create/mixtape`: Step 1 — Mixtape

Select up to 3 songs (use itunes api https://itunes.apple.com/search).

Header: "step one. queue up the mixtape"
Subheader: "pick up to three songs that reminds you of them"
Buttons: "next"
Assets: mixtape-empty.png, cassette-empty.png

User searches for artist or song in search bar. User clicks song and it appears in cassette-empty and mixtape-empty. Users can click play in mixtape-empty visual. 

`/create/letter`: Step 2 — Letter

Written note area with paper texture aesthetic.

Header: "step two. write them a letter"
Subheader: "leave a note for the dashboard. it can be long, short, or just a quick hello."
Buttons: "back", "next"

`/create/memo`: Step 3 — Voice Memo

Optional Web Audio recorder component with tape recorder visual.

State - no recording
- Header: "step three. record a voice memo"
- Subheader: "sometimes messages are better aloud. optional."
- Visual: tape-recorder-off.png
- Buttons: "record audio", "skip"

State - recording
- Header: "step three. record a voice memo"
- Visual: tape-recording.png, tape-recorder-on.png
- Buttons: "stop recording"

State - recording stored
- Header: "step three. record a voice memo"
- Visual: tape-recorded.png, tape-recorder-off.png
- Buttons: "play back", "record again", "done"

`/create/share`: Step 4 — Final Review & Link Generation

Generates unique short link via Supabase Edge Function (/drive/:shortId).

### Receiver Flow
`/drive/:shortId`: The Passenger Seat Experience

Header section
Header: "someone wishes they were driving home to you."
Subheader: "pull up a seat. they left a few things on the dashboard for you."
sets: sunny-drive-loop.mp4, tape-recorder-on-dashboard.png
Sunny drive video loop and tape recorder on dashboard visual.

First section - mixtape
Header: "pop the mixtape in."
Subheader: "songs they picked for the road."
Assets: mixtape-empty.png, cassette-empty.png
Stored songs should be rendered on top of cassette-empty. The first song appears in mixtape-empty. When user clicks next on mixtape-empty, it goes to the next song.


Second section - letter
Header: "a letter left on the passenger seat." 
Subheader: "from them, to you."
Assets: note-empty.png
Message is rendered on top.

Third section - voice memo
Header: "a voice note from the drive."
Subheader: "press the tape recorder to hear their voice."
Assets: tape-recorder-on.png
User clicks on the tape record image to hear the message. Click again to stop it.

Footer Text: "leave this screen open, turn up the volume, and enjoy the drive together."

CTA: Button to "start your drive home".

## Project Structure
```
├── design/                 # Optional: Raw design files, Figma exports, or reference PNGs
│   └── screenshots/        # Full-page screen mocks and reference layouts
├── public/
│   ├── assets/
│   │   ├── fonts/           # Retro pixel fonts and handwriting script fonts
│   │   ├── videos/          # 1920x1080 sunny day driving video loop
│   │   ├── dashboard/       # Car interior, windshield frame, passenger seat graphics
│   │   ├── audio/           # Cassette player UI, dictaphone graphic, tape textures
│   │   └── textures/        # Paper texture backgrounds
├── src/
│   ├── components/
│   │   ├── Creator/         # Steps 1-3 creation components
│   │   ├── Dashboard/       # Receiver dashboard layout & stacked video frame
│   │   ├── AudioPlayer/     # Cassette tape deck player component
│   │   ├── VoiceRecorder/   # Web Audio dictaphone recorder component
│   │   └── UI/              # Pixelated buttons, inputs, retro UI elements
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client setup
│   │   ├── audioStorage.ts  # Blob handling & storage uploads for audio files
│   │   └── assets.ts        # Image and video asset registry
│   ├── store/
│   │   └── driveStore.ts    # Zustand store for draft creation and player state
│   ├── types/
│   │   └── drive.ts         # TypeScript interfaces (DriveData, Song, Memo, etc.)
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── functions/
│   │   └── create-drive/    # Edge function to save drive payload and return shortId
│   └── migrations/
│       └── 001_drives.sql   # Table schema for drive records
```

## Data Schema & Types (src/types/drive.ts)
TypeScript
export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArtUrl?: string;
  audioUrl: string;
}

export interface DriveData {
  id?: string;
  shortId?: string;
  songs: Song[];           // Max 3 songs
  noteText: string;
  voiceMemoUrl?: string;   // Supabase Storage URL
  createdAt?: string;
}

## Key Requirements for Implementation
Design & Tone Strictness:

Use lowercase text for section headers on the receiver dashboard to maintain the lofi, pixel-art vibe.

Stack the driving video directly on top of the dashboard interior graphic for a seamless "looking out the windshield" perspective.

Maintain high scannability and explicit contrast on pixel buttons.

Audio Handling:

Limit recorded voice memos to a maximum of 2 minutes to optimize storage.

Compress voice recordings to .webm or .mp3 before uploading to Supabase Storage.

State Management:

Persist creator drafts in sessionStorage so refreshing during creation does not lose the note or song selections.

Reset store state after successful drive creation.
