export interface Song {
  id: string
  title: string
  artist: string
  audioUrl: string
  albumArtUrl?: string
}

export interface DriveData {
  id?: string
  shortId?: string
  songs: Song[]
  noteText: string
  voiceMemoUrl?: string
  createdAt?: string
}
