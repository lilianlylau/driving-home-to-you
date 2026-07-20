# iTunes Search API integration handoff

## Purpose

This project uses Apple's public iTunes Search API to let users search for songs, select up to three tracks, display album artwork, and play Apple-hosted preview clips. The integration does not require an API key.

The implementation is split into four layers:

1. A server-side search proxy that calls Apple and normalizes its response.
2. A small browser-side search client.
3. A debounced React song picker with audio previews.
4. Server-side validation and persistence of selected song metadata.

## Data contract

Apple's response is converted into an application-owned type rather than being passed directly to the UI:

```ts
export interface Song {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  artworkUrl: string
  previewUrl: string
  trackViewUrl: string
}
```

The current type is `ComposerSong` in `src/types/coverArt.ts`.

Owning this contract isolates the rest of the application from Apple's field names, optional values, and unrelated response data.

## Server-side search proxy

The primary implementation is `api/song-search.ts`. It exposes:

```http
GET /api/song-search?term=<query>
```

It performs the following work:

- Allows only `GET` requests and returns `405` for other methods.
- Trims the search term and requires 2–100 characters.
- Calls `https://itunes.apple.com/search` with these parameters:

```text
term=<query>
media=music
entity=song
limit=12
country=ca
```

- Requests JSON with an `Accept: application/json` header.
- Treats a non-successful Apple response as an upstream failure.
- Filters out non-song and incomplete results. A usable result must have a track ID, track name, artist, preview URL, and store URL.
- Maps results to the local `Song` contract, using empty strings for optional collection names and artwork.
- Returns `502` with a generic error if Apple is unavailable.
- Adds this cache policy to JSON responses:

```http
Cache-Control: public, max-age=300, s-maxage=3600
```

The proxy is useful even though the Apple API needs no secret. It gives the browser a same-origin endpoint, centralizes validation and response mapping, provides consistent errors, and prevents Apple-specific behavior from spreading through the UI.

### Reusable server pattern

```ts
const appleUrl = new URL('https://itunes.apple.com/search')
appleUrl.searchParams.set('term', term)
appleUrl.searchParams.set('media', 'music')
appleUrl.searchParams.set('entity', 'song')
appleUrl.searchParams.set('limit', '12')
appleUrl.searchParams.set('country', 'ca')

const response = await fetch(appleUrl, {
  headers: { Accept: 'application/json' },
})

if (!response.ok) {
  throw new Error(`Apple returned ${response.status}`)
}

const body = await response.json()
const results = (body.results ?? [])
  .filter(
    (song) =>
      song.kind === 'song' &&
      song.trackId &&
      song.trackName &&
      song.artistName &&
      song.previewUrl &&
      song.trackViewUrl,
  )
  .map((song) => ({
    trackId: song.trackId,
    trackName: song.trackName,
    artistName: song.artistName,
    collectionName: song.collectionName ?? '',
    artworkUrl: song.artworkUrl100 ?? '',
    previewUrl: song.previewUrl,
    trackViewUrl: song.trackViewUrl,
  }))
```

## Browser client

`src/lib/songSearch.ts` wraps the application endpoint:

```ts
export async function searchSongs(query: string, signal?: AbortSignal): Promise<Song[]> {
  const response = await fetch(`/api/song-search?term=${encodeURIComponent(query)}`, { signal })

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.error ?? 'song search failed')
  }

  return body.results ?? []
}
```

The current project does not pass an `AbortSignal` into this function; it only suppresses stale results in the component. The version above is recommended for a new project because it cancels the underlying request as well.

Always encode the query because song and artist searches commonly contain spaces, punctuation, and non-ASCII characters.

## React picker behavior

`src/components/SongPicker/SongPicker.tsx` provides the search and preview UI.

Search behavior:

- It does not search until the trimmed query contains at least two characters.
- It waits 350 ms after typing before sending a request.
- Effect cleanup clears the debounce timer and marks the previous request as aborted.
- It exposes `idle`, `loading`, and `error` states to the UI.
- Selecting a result clears both the query and search results.

Selection behavior:

- The user can choose at most three songs.
- Results whose `trackId` is already selected are disabled.
- Songs can be removed from the selected list.
- The store also enforces the maximum with `selectedSongs.slice(0, 3)` in `src/store/cardStore.ts`.

Preview behavior:

- A hidden `<audio>` element streams the selected song's `previewUrl`.
- Clicking the active song toggles playback off.
- Selecting another song changes the audio source and starts it.
- `onEnded` clears the active track.
- Deleting the active track also clears playback state.
- Artwork and audio use `crossOrigin="anonymous"`.

For a new implementation, pass the effect's `AbortController.signal` through `searchSongs(term, controller.signal)` and ignore `AbortError` without displaying an error message.

## Persistence and security validation

Selected songs are submitted with shared-card data as JSON and stored in the `cards.song` JSONB column. Relevant files are:

- `src/lib/shareCard.ts`
- `supabase/functions/share-card/index.ts`
- `supabase/migrations/010_shared_card_song.sql`

The browser sends no more than three songs:

```ts
formData.append('song', JSON.stringify(songs.slice(0, 3)))
```

The receiving function treats this metadata as untrusted, even though it originally came from the application's own search endpoint. It verifies:

- The JSON payload is no larger than 16 KB.
- There are one to three songs.
- Each track ID is a positive safe integer.
- Every text field is a string of no more than 500 characters.
- Track IDs are unique.
- Preview and artwork URLs use HTTPS and belong to allowed Apple media hosts.
- Store links use HTTPS and belong to `itunes.apple.com` or `music.apple.com`.

This validation should be retained in another project if song metadata passes through a browser before it is persisted or rendered for other users. Never trust client-submitted Apple URLs solely because they were initially returned by Apple.

## Development and deployment wiring

In local development, `vite.config.ts` mounts `api/song-search.ts` as middleware at `/api/song-search`. This keeps the development URL identical to production.

In production, the `api/` file is deployed as a serverless endpoint. When moving this integration, adapt the handler to the destination platform:

- Next.js: route handler or API route.
- Vercel without Next.js: serverless function under `api/`.
- Express: `GET /api/song-search` route.
- Cloudflare Workers: `fetch` handler with the same query construction and mapping.

Ensure SPA fallback rewrites do not swallow `/api/*` requests on the chosen host.

## Porting checklist

1. Copy the normalized `Song` type.
2. Add a server endpoint that calls and normalizes the iTunes Search API.
3. Validate the query on the server, not only in the browser.
4. Configure the desired storefront with the `country` parameter.
5. Add the browser search wrapper with URL encoding and abort support.
6. Debounce searches and prevent stale responses from updating the UI.
7. Use `previewUrl` in an `<audio>` element and handle rejected `play()` promises.
8. Deduplicate selections by `trackId` and enforce selection limits at multiple boundaries.
9. Revalidate every field and Apple URL before persistence.
10. Add caching and graceful handling for Apple outages.

## Decisions to revisit in another project

- **Storefront:** This project fixes `country=ca`. Results and previews can differ by country. Use a fixed business storefront, a user preference, or a carefully validated locale mapping.
- **Result count:** The current limit is 12.
- **Artwork size:** The project uses `artworkUrl100`. If larger art is needed, verify Apple's supported artwork URL behavior rather than assuming string substitution is stable. Driving Home to You does not use the artwork.
- **Preview availability:** The integration filters out songs without a preview. Remove that condition if results without playable clips should still appear.
- **Rate control:** The UI debounce and shared caching reduce traffic, but a public production endpoint may also need IP-based rate limiting.
- **Attribution and terms:** Review Apple's current Search API terms and branding requirements before shipping the integration in a different product or region.

## Source map

- `api/song-search.ts` — Apple request, filtering, normalization, caching, and errors.
- `src/lib/songSearch.ts` — browser request wrapper.
- `src/components/SongPicker/SongPicker.tsx` — search, selection, and preview UI.
- `src/types/coverArt.ts` — normalized `ComposerSong` type.
- `src/store/cardStore.ts` — selection state, three-song cap, and persistence.
- `src/lib/shareCard.ts` — serializes selected songs for sharing.
- `supabase/functions/share-card/index.ts` — validates and saves song metadata.
- `supabase/migrations/010_shared_card_song.sql` — adds the JSONB storage column.
- `vite.config.ts` — mounts the endpoint during local development.
