import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Song } from '../types/domain'

export const DRAFT_STORAGE_KEY = 'driving-home-to-you:creator-draft'
export const VOICE_MEMO_BLOB_KEY = 'voice-memo'

export type CreatorStep = 1 | 2 | 3 | 4

export interface VoiceMemoDraft {
  durationMs: number
  mimeType: string
  size: number
}

export interface PlayerDraft {
  activeTrackId: string | null
  positionSeconds: number
  isPlaying: boolean
}

interface DraftState {
  songs: Song[]
  noteText: string
  voiceMemo: VoiceMemoDraft | null
  currentStep: CreatorStep
  player: PlayerDraft
  addSong: (song: Song) => boolean
  removeSong: (songId: string) => void
  setNoteText: (noteText: string) => void
  setVoiceMemo: (voiceMemo: VoiceMemoDraft | null) => void
  setCurrentStep: (currentStep: CreatorStep) => void
  setPlayer: (player: Partial<PlayerDraft>) => void
  clearAfterPublication: () => Promise<void>
}

export const initialDraft = {
  songs: [] as Song[],
  noteText: '',
  voiceMemo: null as VoiceMemoDraft | null,
  currentStep: 1 as CreatorStep,
  player: { activeTrackId: null, positionSeconds: 0, isPlaying: false },
}

export function isValidSongSelection(songs: Song[]) {
  return (
    songs.length >= 1 &&
    songs.length <= 3 &&
    new Set(songs.map((song) => song.id)).size === songs.length
  )
}

export function isValidNote(noteText: string) {
  const trimmed = noteText.trim()
  return trimmed.length >= 1 && trimmed.length <= 500
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      ...initialDraft,
      addSong: (song) => {
        const songs = get().songs
        if (songs.length >= 3 || songs.some(({ id }) => id === song.id)) return false
        set({ songs: [...songs, song] })
        return true
      },
      removeSong: (songId) =>
        set((state) => ({
          songs: state.songs.filter(({ id }) => id !== songId),
          player:
            state.player.activeTrackId === songId
              ? { activeTrackId: null, positionSeconds: 0, isPlaying: false }
              : state.player,
        })),
      setNoteText: (noteText) => set({ noteText: noteText.slice(0, 500) }),
      setVoiceMemo: (voiceMemo) => set({ voiceMemo }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      setPlayer: (player) => set((state) => ({ player: { ...state.player, ...player } })),
      clearAfterPublication: async () => {
        await deleteVoiceMemoBlob()
        set(initialDraft)
      },
    }),
    {
      name: DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ songs, noteText, voiceMemo, currentStep, player }) => ({
        songs,
        noteText,
        voiceMemo,
        currentStep,
        player,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<DraftState>
        return {
          ...current,
          ...saved,
          player: { ...initialDraft.player, ...saved.player, isPlaying: false },
        }
      },
    },
  ),
)

const DATABASE_NAME = 'driving-home-to-you'
const STORE_NAME = 'creator-media'

function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function operateOnMediaStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openMediaDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = operation(transaction.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

export const saveVoiceMemoBlob = (blob: Blob) =>
  operateOnMediaStore('readwrite', (store) => store.put(blob, VOICE_MEMO_BLOB_KEY))

export const getVoiceMemoBlob = () =>
  operateOnMediaStore<Blob | undefined>('readonly', (store) => store.get(VOICE_MEMO_BLOB_KEY))

export const deleteVoiceMemoBlob = () =>
  typeof indexedDB === 'undefined'
    ? Promise.resolve()
    : operateOnMediaStore<undefined>('readwrite', (store) => store.delete(VOICE_MEMO_BLOB_KEY))
