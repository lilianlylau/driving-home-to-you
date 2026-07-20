export const MAX_VOICE_MEMO_BYTES = 5 * 1024 * 1024
export const MAX_VOICE_MEMO_DURATION_MS = 120_000

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

export function selectRecorderMimeType(mediaRecorder: typeof MediaRecorder) {
  return MIME_TYPES.find((type) => mediaRecorder.isTypeSupported(type)) ?? null
}
