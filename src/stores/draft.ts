import { create } from 'zustand'
import type { Song } from '../types/domain'

interface DraftState {
  songs: Song[]
  noteText: string
  setNoteText: (noteText: string) => void
}

export const useDraftStore = create<DraftState>((set) => ({
  songs: [],
  noteText: '',
  setNoteText: (noteText) => set({ noteText }),
}))
