# Mixtape playback navigation bug handoff

## Status

Resolved in the current implementation. The player now retains one application-level
`Audio` instance across creator-route changes and calls `play()` directly from the Play
button's user gesture, including while restored metadata is still loading.

## Resolution

The route-local media element and delayed playback were both contributing risks. A new
element could replace an aborted request after navigation, and deferring `play()` until
`loadedmetadata` could move it outside the browser's user-activation window. The shared
element is paused on route unmount but retains its source and position. Restored
positions are also clamped to the duration reported by the newly loaded media.

The player regression now verifies that Mixtape → Letter → Mixtape reuses the same
media element and that the restored Play click invokes `play()` synchronously before a
pending `loadedmetadata` event.

## User-observed behavior

1. Open `/create/mixtape`.
2. Select multiple songs.
3. Play or select a song.
4. Press **next** and continue to `/create/letter`.
5. Press **back** to return to `/create/mixtape`.
6. Press **play**.

The restored song does not play. Playback starts working only after this sequence:

1. Press **Back** in the player to select the previous song.
2. Press **play**; the previous song plays.
3. Press **Next** in the player; the originally restored song then plays.

The issue was reproduced by the user after both attempted fixes below.

## What is persisting correctly

The Zustand draft store persists these values to `localStorage` under
`driving-home-to-you:creator-draft`:

- selected `Song` objects, including preview URLs;
- letter text;
- current creator step;
- voice memo metadata;
- active track ID;
- player position in seconds; and
- the `isPlaying` flag, rehydrated as `false` after a full refresh.

The voice memo binary is stored separately in IndexedDB. Supabase persistence is not
involved in this bug; these creator pages use the local draft store.

## Relevant implementation

- `src/stores/draft.ts`
- `src/features/player/useMixtapePlayer.ts`
- `src/features/player/useMixtapePlayer.test.tsx`
- `src/components/Player.tsx`
- `src/features/creator/MixtapePage.tsx`
- `src/features/creator/LetterPage.tsx`

`useMixtapePlayer` creates an imperative `Audio` instance when the mixtape component
mounts. Navigating to the letter page destroys that instance. Returning creates another
instance and attempts to restore the active track and elapsed position from Zustand.

## Attempted fixes

### 1. Clear stale playing state on unmount

The player cleanup now pauses its `Audio` instance and changes the persisted
`isPlaying` state to `false`, while retaining the active track and elapsed position.

Reason: the original cleanup paused the browser audio but could leave Zustand reporting
that playback was still active. The first Play click after returning could therefore
toggle the state to paused instead of starting playback.

Result: automated tests passed, but the user reported the same browser behavior.

### 2. Wait for metadata before restoring position

The player now listens for `loadedmetadata` before assigning the saved `currentTime`.
If Play is pressed while metadata is loading, the handler reads the latest Zustand
state and calls `play()` after restoring the position. Stale metadata handlers are
removed when the track changes or the component unmounts.

Reason: switching to Previous resets the position to zero and makes playback work,
which suggested that seeking to a non-zero position before the new audio element was
ready caused the failure.

Result: automated tests passed, but the user again reported the same browser behavior.

## Current test limitation

The regression test uses a `FakeAudio` class. It verifies Zustand state transitions,
`readyState`, the synthetic `loadedmetadata` event, and whether `play()` was called. It
does not exercise a real browser media pipeline, CORS behavior, network loading, browser
autoplay policy, or the actual iTunes preview response.

The passing unit test therefore does not prove that the restored audio can play. A real
Playwright reproduction with intercepted media responses or detailed browser event
instrumentation is needed.

## Recommended next investigation

1. Reproduce in the same browser and device used by the user.
2. Record the active track ID, preview URL, saved position, `readyState`, `networkState`,
   `currentSrc`, and `audio.error` before and after the first Play click.
3. Capture whether `audio.play()` resolves or rejects and retain the rejection name and
   message temporarily in the visible player error during development.
4. Log the sequence of `loadstart`, `loadedmetadata`, `canplay`, `playing`, `pause`,
   `stalled`, `suspend`, `abort`, and `error` events without logging private content.
5. Check whether the restored `currentTime` is beyond the newly reported duration or
   outside the media element's seekable range. Clamp it to a valid seekable position.
6. Check whether assigning the same iTunes preview URL to a new `Audio` object after the
   prior request was aborted leaves the request stalled in the affected browser.
7. Try retaining one application-level `Audio` instance across route changes instead of
   constructing and destroying it inside `MixtapePage`. This is the strongest next design
   option because playback state is already application-level state.
8. Add a Playwright regression that uses deterministic same-origin audio and performs
   Mixtape → Letter → Mixtape before asserting that media reaches the `playing` event.

Avoid treating Previous/Next as the fix. That sequence only forces a source change and
masks the restoration failure.

## Verification completed so far

Before the latest user report, the following passed:

- formatting;
- ESLint;
- strict TypeScript checks;
- player and mixtape unit/component tests;
- the complete unit/component suite; and
- the production build.

These checks do not close the bug because the real-browser reproduction still fails.
